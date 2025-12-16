/**
 * Mishawaka Food Pantry - Shower Booking System
 * Google Apps Script Backend
 *
 * PRODUCTION OPTIMIZED VERSION v1.2
 * - Uses CacheService for performance
 * - Batched spreadsheet operations
 * - Rate limiting for abuse prevention
 * - LockService for concurrent booking safety
 * - Improved error handling and input validation
 * - Optimized auto-expiration with batch updates
 */

const APP_VERSION = '1.2.0';

// ============================================
// CONFIGURATION & CACHING
// ============================================

// Cache keys
const CACHE_KEYS = {
  CONFIG: 'config_v2',
  SLOTS_PREFIX: 'slots_',
  RATE_LIMIT_PREFIX: 'rate_',
};

// Cache durations (seconds)
const CACHE_TTL = {
  CONFIG: 300, // 5 minutes - config rarely changes
  SLOTS: 30, // 30 seconds - slots change with bookings
  RATE_LIMIT: 60, // 1 minute - rate limit window
};

// Rate limiting settings
const RATE_LIMITS = {
  BOOKING_PER_PHONE: 5, // Max booking attempts per phone per minute
  LOOKUP_PER_IP: 20, // Max lookups per minute (general)
  ADMIN_ACTIONS: 30, // Max admin actions per minute
};

/**
 * Get configuration with caching
 * This is the #1 performance improvement - config rarely changes
 */
function getConfig() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEYS.CONFIG);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Cache corrupted, will reload
    }
  }

  // Load fresh config
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  const data = configSheet.getDataRange().getValues();
  const rawConfig = {};

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      rawConfig[data[i][0]] = data[i][1];
    }
  }

  const config = {
    slotDuration: parseInt(rawConfig.slot_duration_min) || 30,
    gracePeriod: parseInt(rawConfig.grace_period_min) || 10,
    startTime: normalizeTimeValue(rawConfig.start_time) || '10:00',
    endTime: normalizeTimeValue(rawConfig.end_time) || '14:00',
    slotsPerTime: parseInt(rawConfig.slots_per_time) || 1,
    adminKey: rawConfig.admin_key || 'shower2024',
    timezone: rawConfig.timezone || 'America/Indiana/Indianapolis',
    bookingClosed:
      rawConfig.booking_enabled === false ||
      rawConfig.booking_enabled === 'FALSE' ||
      rawConfig.booking_enabled === '',
    closedMessage: rawConfig.booking_closed_message || '',
    weekdaysOnly:
      rawConfig.weekdays_only !== false && rawConfig.weekdays_only !== 'FALSE',
    // Production settings
    debugMode: rawConfig.debug_mode === true || rawConfig.debug_mode === 'TRUE',
    rateLimitEnabled:
      rawConfig.rate_limit_enabled !== false &&
      rawConfig.rate_limit_enabled !== 'FALSE',
  };

  // Cache for 5 minutes
  cache.put(CACHE_KEYS.CONFIG, JSON.stringify(config), CACHE_TTL.CONFIG);

  return config;
}

/**
 * Clear config cache - call after updating Config sheet
 */
function clearConfigCache() {
  const cache = CacheService.getScriptCache();
  cache.remove(CACHE_KEYS.CONFIG);
}

/**
 * Get spreadsheet reference (single instance per execution)
 */
let _spreadsheetInstance = null;
function getSpreadsheet() {
  if (!_spreadsheetInstance) {
    _spreadsheetInstance = SpreadsheetApp.getActiveSpreadsheet();
  }
  return _spreadsheetInstance;
}

/**
 * Get slots sheet reference
 */
let _slotsSheetInstance = null;
function getSlotsSheet() {
  if (!_slotsSheetInstance) {
    _slotsSheetInstance = getSpreadsheet().getSheetByName('Slots');
  }
  return _slotsSheetInstance;
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Check rate limit for an action
 * @param {string} key - Unique key (phone, IP, etc.)
 * @param {number} limit - Max requests per window
 * @param {Object} [config] - Optional config object to avoid re-fetching
 * @returns {boolean} - true if allowed, false if rate limited
 */
function checkRateLimit(key, limit, config) {
  config = config || getConfig();
  if (!config.rateLimitEnabled) return true;

  const cache = CacheService.getScriptCache();
  const cacheKey = CACHE_KEYS.RATE_LIMIT_PREFIX + key;
  const current = parseInt(cache.get(cacheKey)) || 0;

  if (current >= limit) {
    return false;
  }

  cache.put(cacheKey, String(current + 1), CACHE_TTL.RATE_LIMIT);
  return true;
}

// ============================================
// WEB APP ROUTING
// ============================================

function doGet(e) {
  const page = e.parameter.page || 'book';
  const config = getConfig();

  switch (page) {
    case 'book':
    case 'status':
      return HtmlService.createTemplateFromFile('booking')
        .evaluate()
        .setTitle('Shower Booking - Mishawaka Food Pantry')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');

    case 'admin':
      const key = e.parameter.key || '';
      // Use constant-time comparison to prevent timing attacks
      if (!constantTimeCompare(key, config.adminKey)) {
        // Add small delay to prevent brute force
        Utilities.sleep(500);
        return HtmlService.createHtmlOutput(
          '<h1>Access Denied</h1><p>Invalid admin key.</p><p><a href="javascript:history.back()">Go back</a></p>'
        );
      }
      const adminTemplate = HtmlService.createTemplateFromFile('admin');
      adminTemplate.adminKey = key;
      return adminTemplate
        .evaluate()
        .setTitle('Staff Dashboard - Shower Booking')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');

    case 'manifest':
      return getManifest();

    case 'sw':
      return getServiceWorker();

    default:
      return HtmlService.createHtmlOutput('<h1>Page not found</h1>');
  }
}

function doPost(e) {
  const action = e.parameter.action;
  let data;

  try {
    data = JSON.parse(e.postData.contents || '{}');
  } catch (e) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Invalid request data' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  switch (action) {
    case 'book':
      return ContentService.createTextOutput(
        JSON.stringify(bookSlot(data))
      ).setMimeType(ContentService.MimeType.JSON);
    case 'checkin':
      return ContentService.createTextOutput(
        JSON.stringify(checkIn(data))
      ).setMimeType(ContentService.MimeType.JSON);
    case 'adminAction':
      return ContentService.createTextOutput(
        JSON.stringify(adminAction(data))
      ).setMimeType(ContentService.MimeType.JSON);
    default:
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Unknown action' })
      ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Include HTML partials
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// PWA SUPPORT
// ============================================

function getManifest() {
  const scriptUrl = ScriptApp.getService().getUrl();

  const manifest = {
    name: 'Mishawaka Shower Booking',
    short_name: 'Showers',
    description: 'Book your shower appointment at Mishawaka Food Pantry',
    start_url: scriptUrl + '?page=book',
    scope: scriptUrl,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f3f0',
    theme_color: '#1a3a3a',
    icons: [
      {
        src: 'data:image/svg+xml,' + encodeURIComponent(getPwaIconSvg(192)),
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
      {
        src: 'data:image/svg+xml,' + encodeURIComponent(getPwaIconSvg(512)),
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    categories: ['utilities', 'lifestyle'],
    lang: 'en-US',
    dir: 'ltr',
  };

  return ContentService.createTextOutput(JSON.stringify(manifest)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getPwaIconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#1a3a3a"/>
    <g transform="translate(${size * 0.2}, ${size * 0.15}) scale(${
    size / 100
  })">
      <rect x="20" y="5" width="20" height="6" rx="2" fill="#e07b53"/>
      <rect x="25" y="11" width="10" height="4" rx="1" fill="#e07b53"/>
      <ellipse cx="22" cy="28" rx="3" ry="5" fill="#fff" opacity="0.9"/>
      <ellipse cx="30" cy="32" rx="3" ry="5" fill="#fff" opacity="0.9"/>
      <ellipse cx="38" cy="28" rx="3" ry="5" fill="#fff" opacity="0.9"/>
      <ellipse cx="26" cy="42" rx="3" ry="5" fill="#fff" opacity="0.8"/>
      <ellipse cx="34" cy="46" rx="3" ry="5" fill="#fff" opacity="0.8"/>
      <ellipse cx="30" cy="58" rx="3" ry="5" fill="#fff" opacity="0.7"/>
    </g>
  </svg>`;
}

function getServiceWorker() {
  const swCode = `
const CACHE_NAME = 'shower-booking-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
`;

  return ContentService.createTextOutput(swCode).setMimeType(
    ContentService.MimeType.JAVASCRIPT
  );
}

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Normalize time values from Google Sheets
 * Sheets can return Date objects, strings, or numbers for time cells
 * This converts them all to "HH:MM" string format
 */
function normalizeTimeValue(timeVal) {
  if (timeVal == null || timeVal === '') {
    return null;
  }

  // Handle Date objects (Google Sheets returns these for time-formatted cells)
  if (
    timeVal instanceof Date ||
    (typeof timeVal === 'object' && timeVal.getHours)
  ) {
    const hours = timeVal.getHours();
    const minutes = timeVal.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  // Handle string format - already good
  if (typeof timeVal === 'string' && timeVal.includes(':')) {
    return timeVal;
  }

  // Handle numeric time (fraction of day)
  if (typeof timeVal === 'number') {
    const totalMinutes = Math.round(timeVal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  // Fallback - try to convert to string
  return String(timeVal);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Ensure both strings are same length by padding shorter one
  const maxLen = Math.max(a.length, b.length);
  const paddedA = a.padEnd(maxLen, '\0');
  const paddedB = b.padEnd(maxLen, '\0');

  let result = 0;
  for (let i = 0; i < maxLen; i++) {
    result |= paddedA.charCodeAt(i) ^ paddedB.charCodeAt(i);
  }

  // Also compare original lengths
  result |= a.length ^ b.length;

  return result === 0;
}

// ============================================
// TIME & DATE UTILITIES
// ============================================

function getTodayString(config) {
  config = config || getConfig();
  const now = new Date();
  return Utilities.formatDate(now, config.timezone, 'yyyy-MM-dd');
}

function getCurrentTime(config) {
  config = config || getConfig();
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: config.timezone })
  );
}

function parseTime(timeStr) {
  if (timeStr == null) {
    return { hours: 0, minutes: 0 };
  }

  // Handle Date objects
  if (
    timeStr instanceof Date ||
    (typeof timeStr === 'object' && typeof timeStr.getHours === 'function')
  ) {
    return { hours: timeStr.getHours(), minutes: timeStr.getMinutes() };
  }

  // Handle string format "HH:MM"
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  // Handle numeric time (Google Sheets stores time as fraction of day)
  if (typeof timeStr === 'number') {
    const totalMinutes = Math.round(timeStr * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  }

  // Fallback - try to convert to string
  const str = String(timeStr);
  if (str.includes(':')) {
    const [hours, minutes] = str.split(':').map(Number);
    return { hours, minutes };
  }

  return { hours: 0, minutes: 0 };
}

function normalizeTimeToString(timeVal) {
  if (timeVal == null) return '00:00';

  if (
    timeVal instanceof Date ||
    (typeof timeVal === 'object' && typeof timeVal.getHours === 'function')
  ) {
    const hours = timeVal.getHours();
    const minutes = timeVal.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  if (typeof timeVal === 'string' && timeVal.includes(':')) {
    return timeVal;
  }

  if (typeof timeVal === 'number') {
    const totalMinutes = Math.round(timeVal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  const { hours, minutes } = parseTime(timeVal);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

function timeToMinutes(timeStr) {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

function formatTimeForDisplay(timeStr) {
  const { hours, minutes } = parseTime(timeStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function generateTimeSlots() {
  return generateTimeSlotsWithConfig();
}

function generateTimeSlotsWithConfig(config) {
  config = config || getConfig();
  const slots = [];
  const startMinutes = timeToMinutes(config.startTime);
  const endMinutes = timeToMinutes(config.endTime);

  for (let m = startMinutes; m < endMinutes; m += config.slotDuration) {
    slots.push(minutesToTime(m));
  }

  return slots;
}

// ============================================
// SLOT MANAGEMENT (OPTIMIZED)
// ============================================

/**
 * Get today's bookings from sheet (with short-term caching)
 * This is the main data function - caching it significantly reduces load times
 * @param {Object} [config] - Optional config object to avoid re-fetching
 *
 * Sheet columns: date (A), time (B), phone (C), status (D), booked_at (E), checked_in_at (F)
 */
function getTodayBookingsData(config) {
  config = config || getConfig();
  const today = getTodayString(config);
  const cache = CacheService.getScriptCache();
  const cacheKey = CACHE_KEYS.SLOTS_PREFIX + today;

  // Try cache first (30 second TTL for slot data)
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Cache corrupted
    }
  }

  // Load fresh data
  const sheet = getSlotsSheet();
  const data = sheet.getDataRange().getValues();
  const bookings = [];

  for (let i = 1; i < data.length; i++) {
    let rowDate = data[i][0];
    if (rowDate instanceof Date) {
      rowDate = Utilities.formatDate(rowDate, config.timezone, 'yyyy-MM-dd');
    }

    if (rowDate === today) {
      bookings.push({
        row: i + 1,
        date: rowDate,
        time: normalizeTimeToString(data[i][1]),
        phone: String(data[i][2]).replace(/\D/g, ''),
        status: data[i][3],
        bookedAt: data[i][4],
        checkedInAt: data[i][5],
      });
    }
  }

  // Cache for 30 seconds
  cache.put(cacheKey, JSON.stringify(bookings), CACHE_TTL.SLOTS);

  return bookings;
}

/**
 * Invalidate today's slot cache (call after any booking changes)
 */
function invalidateSlotsCache() {
  const today = getTodayString();
  const cache = CacheService.getScriptCache();
  cache.remove(CACHE_KEYS.SLOTS_PREFIX + today);
}

function getAvailableSlots() {
  return getAvailableSlotsWithConfig();
}

/**
 * Get available slots with optional config parameter
 * @param {Object} [config] - Optional config object to avoid re-fetching
 */
function getAvailableSlotsWithConfig(config) {
  config = config || getConfig();
  const bookingStatus = apiGetBookingStatus(null, config);

  if (!bookingStatus.open) {
    return [];
  }

  const now = getCurrentTime(config);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Get all possible time slots
  const allSlots = generateTimeSlotsWithConfig(config);

  // Get existing bookings (cached)
  const todayBookings = getTodayBookingsData(config);
  const bookedTimes = {};

  for (const booking of todayBookings) {
    if (['booked', 'checked_in', 'expired'].includes(booking.status)) {
      bookedTimes[booking.time] = (bookedTimes[booking.time] || 0) + 1;
    }
  }

  // Filter to available slots
  const available = [];
  for (const slot of allSlots) {
    const slotMinutes = timeToMinutes(slot);
    const bookedCount = bookedTimes[slot] || 0;

    if (slotMinutes > currentMinutes && bookedCount < config.slotsPerTime) {
      available.push({
        time: slot,
        display: formatTimeForDisplay(slot),
        remaining: config.slotsPerTime - bookedCount,
      });
    }
  }

  return available;
}

function bookSlot(data) {
  const { time, phone } = data;
  const config = getConfig();
  const today = getTodayString(config);

  // Validate input
  if (!time || !phone) {
    return { success: false, error: 'Time and phone number are required.' };
  }

  // Clean and validate phone number
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { success: false, error: 'Please enter a valid phone number.' };
  }

  // Additional validation: ensure phone is numeric after cleaning
  if (!/^\d+$/.test(cleanPhone)) {
    return { success: false, error: 'Invalid phone number format.' };
  }

  // Rate limiting
  if (
    !checkRateLimit('book_' + cleanPhone, RATE_LIMITS.BOOKING_PER_PHONE, config)
  ) {
    return {
      success: false,
      error: 'Too many booking attempts. Please wait a moment and try again.',
    };
  }

  // Check if booking is open
  const bookingStatus = apiGetBookingStatus(null, config);
  if (!bookingStatus.open) {
    return { success: false, error: bookingStatus.message };
  }

  // Use a lock to prevent race conditions on concurrent bookings
  const lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds to acquire lock
    if (!lock.tryLock(10000)) {
      return {
        success: false,
        error: 'System is busy. Please try again in a moment.',
      };
    }

    // Invalidate cache and re-fetch fresh data within the lock
    invalidateSlotsCache();
    const todayBookings = getTodayBookingsData(config);
    const sheet = getSlotsSheet();

    // Check existing bookings
    for (const booking of todayBookings) {
      if (
        booking.phone === cleanPhone &&
        ['booked', 'checked_in'].includes(booking.status)
      ) {
        return {
          success: false,
          error: 'You already have a shower scheduled for today.',
        };
      }
    }

    // Check slot availability with fresh data
    const availableSlots = getAvailableSlotsWithConfig(config);
    const slotAvailable = availableSlots.find((s) => s.time === time);
    if (!slotAvailable) {
      return {
        success: false,
        error: 'This time slot is no longer available. Please choose another.',
      };
    }

    // Add the booking (no code column - phone is the identifier)
    const now = new Date();
    sheet.appendRow([today, time, cleanPhone, 'booked', now, '']);

    // Invalidate cache after write
    invalidateSlotsCache();

    return {
      success: true,
      time: time,
      displayTime: formatTimeForDisplay(time),
    };
  } finally {
    lock.releaseLock();
  }
}

// ============================================
// STATUS & CHECK-IN
// ============================================

/**
 * Get booking by phone number (replaces getBookingByCode)
 */
function getBookingByPhone(phone) {
  if (!phone || typeof phone !== 'string') return null;

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) return null;
  const todayBookings = getTodayBookingsData();

  // Find active booking for this phone (booked or checked_in)
  let booking = todayBookings.find(
    (b) => b.phone === cleanPhone && ['booked', 'checked_in'].includes(b.status)
  );

  // If no active booking, find the most recent expired/cancelled one
  if (!booking) {
    booking = todayBookings.find(
      (b) =>
        b.phone === cleanPhone && ['expired', 'cancelled'].includes(b.status)
    );
  }

  if (booking) {
    return {
      ...booking,
      displayTime: formatTimeForDisplay(booking.time),
    };
  }

  return null;
}

function getBookingStatus(phone) {
  const booking = getBookingByPhone(phone);
  const config = getConfig();

  if (!booking) {
    // In production, don't expose debug info
    return { found: false };
  }

  const now = getCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeToMinutes(booking.time);
  const minutesUntil = slotMinutes - currentMinutes;

  const canCheckIn =
    booking.status === 'booked' &&
    minutesUntil <= 10 &&
    minutesUntil >= -config.gracePeriod;

  return {
    found: true,
    ...booking,
    minutesUntil: minutesUntil,
    canCheckIn: canCheckIn,
    gracePeriod: config.gracePeriod,
  };
}

function checkIn(data) {
  const { phone } = data;

  if (!phone) {
    return { success: false, error: 'Phone number is required.' };
  }

  const booking = getBookingByPhone(phone);

  if (!booking) {
    return { success: false, error: 'Booking not found.' };
  }

  if (booking.status !== 'booked') {
    return {
      success: false,
      error: `Cannot check in. Current status: ${booking.status}`,
    };
  }

  const config = getConfig();
  const now = getCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeToMinutes(booking.time);
  const minutesUntil = slotMinutes - currentMinutes;

  if (minutesUntil > 10) {
    return {
      success: false,
      error:
        'Too early to check in. Please come back closer to your scheduled time.',
    };
  }

  if (minutesUntil < -config.gracePeriod) {
    return {
      success: false,
      error: 'Your slot has expired. Please book a new time.',
    };
  }

  // Update status (column D is status, column F is checked_in_at)
  const sheet = getSlotsSheet();
  sheet.getRange(booking.row, 4).setValue('checked_in');
  sheet.getRange(booking.row, 6).setValue(new Date());

  // Invalidate cache
  invalidateSlotsCache();

  return {
    success: true,
    message: 'You are checked in! Please wait to be called.',
    time: booking.displayTime,
  };
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

function getTodayBookings() {
  const todayBookings = getTodayBookingsData();

  // Add display formatting and mask phones for display
  const formatted = todayBookings.map((booking) => ({
    ...booking,
    displayTime: formatTimeForDisplay(booking.time),
    maskedPhone: maskPhone(booking.phone),
    // Keep full phone for admin actions
    fullPhone: booking.phone,
  }));

  // Sort by time
  formatted.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  return formatted;
}

function maskPhone(phone) {
  if (!phone || phone.length < 4) return '****';
  return '***-***-' + phone.slice(-4);
}

/**
 * Admin action - now uses phone+time as identifier instead of code
 */
function adminAction(data) {
  const { phone, time, action, adminKey } = data;

  if (!phone || !time || !action || !adminKey) {
    return { success: false, error: 'Missing required parameters.' };
  }

  const config = getConfig();

  if (!constantTimeCompare(adminKey, config.adminKey)) {
    return { success: false, error: 'Invalid admin key.' };
  }

  // Rate limiting for admin
  if (!checkRateLimit('admin_' + adminKey, RATE_LIMITS.ADMIN_ACTIONS)) {
    return { success: false, error: 'Too many actions. Please wait a moment.' };
  }

  // Find booking by phone and time
  const todayBookings = getTodayBookingsData(config);
  const booking = todayBookings.find(
    (b) => b.phone === phone && b.time === time
  );

  if (!booking) {
    return { success: false, error: 'Booking not found.' };
  }

  const sheet = getSlotsSheet();

  // Column indices: D=status (4), F=checked_in_at (6)
  switch (action) {
    case 'checkin':
      sheet.getRange(booking.row, 4).setValue('checked_in');
      sheet.getRange(booking.row, 6).setValue(new Date());
      invalidateSlotsCache();
      return { success: true, message: 'Marked as checked in.' };

    case 'noshow':
      sheet.getRange(booking.row, 4).setValue('expired');
      invalidateSlotsCache();
      return { success: true, message: 'Marked as no-show.' };

    case 'cancel':
      sheet.getRange(booking.row, 4).setValue('cancelled');
      invalidateSlotsCache();
      return { success: true, message: 'Booking cancelled.' };

    default:
      return { success: false, error: 'Unknown action.' };
  }
}

// ============================================
// AUTOMATED TRIGGERS
// ============================================

function autoExpireSlots() {
  const sheet = getSlotsSheet();
  const data = sheet.getDataRange().getValues();
  const config = getConfig();
  const today = getTodayString(config);
  const now = getCurrentTime(config);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const rowsToExpire = [];

  for (let i = 1; i < data.length; i++) {
    let rowDate = data[i][0];
    if (rowDate instanceof Date) {
      rowDate = Utilities.formatDate(rowDate, config.timezone, 'yyyy-MM-dd');
    }

    const rowTime = normalizeTimeToString(data[i][1]);
    const rowStatus = data[i][3]; // Column D is status

    if (rowDate === today && rowStatus === 'booked') {
      const slotMinutes = timeToMinutes(rowTime);
      const expireTime = slotMinutes + config.gracePeriod;

      if (currentMinutes > expireTime) {
        rowsToExpire.push(i + 1);
      }
    }
  }

  // Update expired slots (individual updates needed for non-contiguous rows)
  if (rowsToExpire.length > 0) {
    for (const row of rowsToExpire) {
      sheet.getRange(row, 4).setValue('expired');
    }

    invalidateSlotsCache();
    if (config.debugMode) {
      Logger.log(`Auto-expired ${rowsToExpire.length} slots`);
    }
  }
}

function dailyMaintenance() {
  const sheet = getSlotsSheet();
  const data = sheet.getDataRange().getValues();
  const config = getConfig();
  const today = getTodayString(config);

  // Delete all rows older than today (keep header)
  const rowsToDelete = [];
  for (let i = data.length - 1; i >= 1; i--) {
    let rowDate = data[i][0];
    if (rowDate instanceof Date) {
      rowDate = Utilities.formatDate(rowDate, config.timezone, 'yyyy-MM-dd');
    }

    if (rowDate < today) {
      rowsToDelete.push(i + 1);
    }
  }

  // Delete from bottom to top to maintain row indices
  // Batch deletion is more efficient for large datasets
  if (rowsToDelete.length > 0) {
    // Delete in reverse order to maintain indices
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowsToDelete[i]);
    }
  }

  // Clear all caches
  const cache = CacheService.getScriptCache();
  cache.removeAll([CACHE_KEYS.CONFIG]);
  invalidateSlotsCache();

  if (config.debugMode) {
    Logger.log(`Daily maintenance: deleted ${rowsToDelete.length} old rows`);
  }
}

// ============================================
// API FUNCTIONS (called from HTML)
// ============================================

function apiGetAvailableSlots() {
  return getAvailableSlots();
}

function apiBookSlot(time, phone) {
  return bookSlot({ time, phone });
}

function apiGetBookingStatus(phone, config) {
  // This function is overloaded - with phone it returns booking status
  // Without phone (or called internally) it returns booking system status
  if (phone) {
    return getBookingStatus(phone);
  }

  config = config || getConfig();
  const now = getCurrentTime(config);

  // Check if booking is manually closed
  if (config.bookingClosed) {
    const defaultMessage =
      'Shower booking is currently closed. Please check back later or speak with staff.';
    return {
      open: false,
      reason: 'closed',
      message: config.closedMessage || defaultMessage,
    };
  }

  // Check for weekend
  if (config.weekdaysOnly && isWeekend(config)) {
    return {
      open: false,
      reason: 'weekend',
      message:
        'Shower services are available Monday through Friday. Please come back on a weekday to book your shower.',
    };
  }

  // Check if booking opens 30 minutes before start time
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(config.startTime);
  const endMinutes = timeToMinutes(config.endTime);
  const bookingOpensAt = startMinutes - 30; // Opens 30 min before first shower

  if (currentMinutes < bookingOpensAt) {
    // Calculate when booking opens for display
    const opensHour = Math.floor(bookingOpensAt / 60);
    const opensMin = bookingOpensAt % 60;
    const period = opensHour >= 12 ? 'PM' : 'AM';
    const displayHour =
      opensHour > 12 ? opensHour - 12 : opensHour === 0 ? 12 : opensHour;
    const opensTimeDisplay = `${displayHour}:${opensMin
      .toString()
      .padStart(2, '0')} ${period}`;

    return {
      open: false,
      reason: 'too_early',
      message: `Shower booking opens at ${opensTimeDisplay} (30 minutes before the first available shower). Please check back then.`,
    };
  }

  // Check if we're past the end time
  if (currentMinutes >= endMinutes) {
    return {
      open: false,
      reason: 'closed_for_day',
      message:
        'Shower booking for today has ended. Please come back tomorrow during operating hours.',
    };
  }

  return {
    open: true,
    reason: null,
    message: null,
  };
}

function apiCheckIn(phone) {
  return checkIn({ phone });
}

function apiCancelExpiredBooking(phone) {
  if (!phone) {
    return { success: false, error: 'Phone number is required.' };
  }

  const booking = getBookingByPhone(phone);

  if (!booking) {
    return { success: false, error: 'Booking not found.' };
  }

  if (booking.status !== 'booked') {
    return { success: false, error: 'Booking cannot be cancelled.' };
  }

  const config = getConfig();
  const now = getCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeToMinutes(booking.time);
  const minutesUntil = slotMinutes - currentMinutes;

  if (minutesUntil > -config.gracePeriod) {
    return { success: false, error: 'Your check-in window is still open.' };
  }

  const sheet = getSlotsSheet();
  sheet.getRange(booking.row, 4).setValue('expired'); // Column D
  invalidateSlotsCache();

  return { success: true };
}

/**
 * Cancel a booking (user-initiated)
 * - If the slot time hasn't passed, the slot is released for others to book
 * - If the slot time has already passed, it's just marked cancelled (not re-released)
 */
function apiCancelBooking(phone) {
  if (!phone) {
    return { success: false, error: 'Phone number is required.' };
  }

  const booking = getBookingByPhone(phone);

  if (!booking) {
    return { success: false, error: 'Booking not found.' };
  }

  if (booking.status !== 'booked') {
    return { success: false, error: 'This booking cannot be cancelled.' };
  }

  const config = getConfig();
  const now = getCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeToMinutes(booking.time);
  const minutesUntil = slotMinutes - currentMinutes;

  // Mark as cancelled (Column D)
  const sheet = getSlotsSheet();
  sheet.getRange(booking.row, 4).setValue('cancelled');
  invalidateSlotsCache();

  // Determine if the slot can be re-released for booking
  // Only if the slot time is still in the future (with a small buffer)
  const slotReleased = minutesUntil > 0;

  return {
    success: true,
    slotReleased: slotReleased,
    message: slotReleased
      ? 'Your reservation has been cancelled. The time slot is now available for others.'
      : 'Your reservation has been cancelled.',
  };
}

function apiLookupByPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { found: false, error: 'Invalid phone number' };
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { found: false, error: 'Invalid phone number' };
  }

  // Rate limiting
  if (!checkRateLimit('lookup_' + cleanPhone, RATE_LIMITS.LOOKUP_PER_IP)) {
    return { found: false, error: 'Too many requests. Please wait a moment.' };
  }

  const config = getConfig();
  const now = getCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Use cached booking data
  const todayBookings = getTodayBookingsData();

  let activeBooking = null;
  let expiredBooking = null;

  for (const booking of todayBookings) {
    if (booking.phone !== cleanPhone) continue;

    const slotMinutes = timeToMinutes(booking.time);
    const minutesUntil = slotMinutes - currentMinutes;

    const bookingData = {
      date: booking.date,
      time: booking.time,
      displayTime: formatTimeForDisplay(booking.time),
      status: booking.status,
      minutesUntil: minutesUntil,
      canCheckIn:
        booking.status === 'booked' &&
        minutesUntil <= 10 &&
        minutesUntil >= -config.gracePeriod,
      gracePeriod: config.gracePeriod,
    };

    if (['booked', 'checked_in'].includes(booking.status)) {
      activeBooking = bookingData;
    } else if (['expired', 'cancelled'].includes(booking.status)) {
      expiredBooking = bookingData;
    }
  }

  if (activeBooking) {
    return { found: true, hasBooking: true, booking: activeBooking };
  }

  if (expiredBooking) {
    return { found: true, hasBooking: true, booking: expiredBooking };
  }

  return { found: true, hasBooking: false };
}

function apiGetTodayBookings(adminKey) {
  try {
    const config = getConfig();
    if (!constantTimeCompare(adminKey, config.adminKey)) {
      return { error: 'Invalid admin key' };
    }
    try {
      return getTodayBookings();
    } catch (innerError) {
      Logger.log('Error in getTodayBookings: ' + innerError.message);
      return {
        error: 'Failed to load bookings: ' + innerError.message,
        bookings: [],
      };
    }
  } catch (error) {
    Logger.log('Error in apiGetTodayBookings: ' + error.message);
    return { error: 'Failed to load bookings: ' + error.message, bookings: [] };
  }
}

/**
 * Combined API for admin page initial load
 */
function apiGetAdminInitialData(adminKey) {
  try {
    const config = getConfig();
    if (!constantTimeCompare(adminKey, config.adminKey)) {
      return { error: 'Invalid admin key' };
    }

    try {
      const bookings = getTodayBookings();
      const bookingStatus = apiGetBookingStatus(null, config);

      return {
        bookings: bookings || [],
        bookingStatus: bookingStatus || { open: true },
        settings: {
          slotDuration: config.slotDuration,
          gracePeriod: config.gracePeriod,
          startTime: config.startTime,
          endTime: config.endTime,
        },
        version: APP_VERSION,
      };
    } catch (innerError) {
      Logger.log(
        'Error in apiGetAdminInitialData data fetching: ' + innerError.message
      );
      // Return partial data with error indication
      return {
        error: 'Failed to load bookings data: ' + innerError.message,
        bookings: [],
        bookingStatus: apiGetBookingStatus(null, config) || { open: true },
        settings: {
          slotDuration: config.slotDuration,
          gracePeriod: config.gracePeriod,
          startTime: config.startTime,
          endTime: config.endTime,
        },
        version: APP_VERSION,
      };
    }
  } catch (error) {
    Logger.log('Error in apiGetAdminInitialData: ' + error.message);
    return {
      error: 'Failed to load admin data: ' + error.message,
      bookings: [],
      bookingStatus: { open: true, error: true },
      settings: {
        slotDuration: 30,
        gracePeriod: 10,
        startTime: '10:00',
        endTime: '14:00',
      },
      version: APP_VERSION,
    };
  }
}

function apiAdminAction(phone, time, action, adminKey) {
  return adminAction({ phone, time, action, adminKey });
}

function apiGetCurrentTime() {
  const config = getConfig();
  const now = getCurrentTime(config);
  return {
    time: Utilities.formatDate(now, config.timezone, 'h:mm a'),
    date: Utilities.formatDate(now, config.timezone, 'EEEE, MMMM d, yyyy'),
  };
}

/**
 * Verify admin key (for staff login)
 * Returns { valid: true/false, adminUrl: string } - doesn't expose why it's invalid
 */
function apiVerifyAdminKey(key) {
  const config = getConfig();

  // Small delay to prevent brute force timing attacks
  Utilities.sleep(200);

  const isValid = constantTimeCompare(key, config.adminKey);

  // Get the actual deployed web app URL (not the editor preview URL)
  let adminUrl = null;
  if (isValid) {
    try {
      const scriptUrl = ScriptApp.getService().getUrl();
      adminUrl = scriptUrl + '?page=admin&key=' + encodeURIComponent(key);
    } catch (e) {
      // If we can't get the service URL, return null and let frontend handle it
      Logger.log('Could not get service URL: ' + e.message);
    }
  }

  return {
    valid: isValid,
    adminUrl: adminUrl,
  };
}

/**
 * Combined API for initial page load - reduces round trips
 * Returns booking status, current time, and optionally phone lookup in one call
 */
function apiGetInitialData(phone) {
  const config = getConfig();
  const now = getCurrentTime(config);

  const result = {
    version: APP_VERSION,
    bookingStatus: apiGetBookingStatus(null, config),
    currentTime: {
      time: Utilities.formatDate(now, config.timezone, 'h:mm a'),
      date: Utilities.formatDate(now, config.timezone, 'EEEE, MMMM d, yyyy'),
    },
    phoneLookup: null,
  };

  // If phone provided, include lookup result
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      result.phoneLookup = apiLookupByPhoneInternal(cleanPhone, config);
    }
  }

  return result;
}

/**
 * Internal phone lookup (skips rate limiting when called from apiGetInitialData)
 */
function apiLookupByPhoneInternal(cleanPhone, config) {
  config = config || getConfig();
  const now = getCurrentTime(config);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayBookings = getTodayBookingsData(config);

  let activeBooking = null;
  let expiredBooking = null;

  for (const booking of todayBookings) {
    if (booking.phone !== cleanPhone) continue;

    const slotMinutes = timeToMinutes(booking.time);
    const minutesUntil = slotMinutes - currentMinutes;

    const bookingData = {
      date: booking.date,
      time: booking.time,
      displayTime: formatTimeForDisplay(booking.time),
      status: booking.status,
      minutesUntil: minutesUntil,
      canCheckIn:
        booking.status === 'booked' &&
        minutesUntil <= 10 &&
        minutesUntil >= -config.gracePeriod,
      gracePeriod: config.gracePeriod,
    };

    if (['booked', 'checked_in'].includes(booking.status)) {
      activeBooking = bookingData;
    } else if (['expired', 'cancelled'].includes(booking.status)) {
      expiredBooking = bookingData;
    }
  }

  if (activeBooking) {
    return { found: true, hasBooking: true, booking: activeBooking };
  }

  if (expiredBooking) {
    return { found: true, hasBooking: true, booking: expiredBooking };
  }

  return { found: true, hasBooking: false };
}

function isWeekend(config) {
  const now = getCurrentTime(config);
  const dayOfWeek = now.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function apiSetBookingStatus(adminKey, isOpen, customMessage) {
  const config = getConfig();

  if (!constantTimeCompare(adminKey, config.adminKey)) {
    return { success: false, error: 'Invalid admin key' };
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Config');
    const data = configSheet.getDataRange().getValues();

    let bookingEnabledRow = -1;
    let closedMessageRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'booking_enabled') {
        bookingEnabledRow = i + 1;
      }
      if (data[i][0] === 'booking_closed_message') {
        closedMessageRow = i + 1;
      }
    }

    if (bookingEnabledRow === -1) {
      configSheet.appendRow(['booking_enabled', isOpen]);
    } else {
      configSheet.getRange(bookingEnabledRow, 2).setValue(isOpen);
    }

    if (closedMessageRow === -1) {
      configSheet.appendRow(['booking_closed_message', customMessage || '']);
    } else {
      configSheet.getRange(closedMessageRow, 2).setValue(customMessage || '');
    }

    // Clear config cache since we just changed it
    clearConfigCache();

    return { success: true };
  } catch (e) {
    Logger.log('Error setting booking status: ' + e.message);
    return { success: false, error: 'Failed to update configuration' };
  }
}

/**
 * Get current settings for admin panel
 */
function apiGetSettings(adminKey) {
  const config = getConfig();

  if (!constantTimeCompare(adminKey, config.adminKey)) {
    return { success: false, error: 'Invalid admin key' };
  }

  return {
    success: true,
    settings: {
      slotDuration: config.slotDuration,
      gracePeriod: config.gracePeriod,
      startTime: config.startTime,
      endTime: config.endTime,
    },
  };
}

/**
 * Update settings from admin panel
 * Only allows updating: slot_duration_min, grace_period_min, start_time, end_time
 */
function apiUpdateSettings(adminKey, settings) {
  const config = getConfig();

  if (!constantTimeCompare(adminKey, config.adminKey)) {
    return { success: false, error: 'Invalid admin key' };
  }

  // Validate settings
  if (settings.slotDuration !== undefined) {
    const duration = parseInt(settings.slotDuration);
    if (isNaN(duration) || duration < 10 || duration > 120) {
      return {
        success: false,
        error: 'Shower duration must be between 10 and 120 minutes',
      };
    }
  }

  if (settings.gracePeriod !== undefined) {
    const grace = parseInt(settings.gracePeriod);
    if (isNaN(grace) || grace < 0 || grace > 60) {
      return {
        success: false,
        error: 'Late check-in window must be between 0 and 60 minutes',
      };
    }
  }

  if (settings.startTime !== undefined || settings.endTime !== undefined) {
    const startTime = settings.startTime || config.startTime;
    const endTime = settings.endTime || config.endTime;

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return {
        success: false,
        error: 'Invalid time format. Use HH:MM (e.g., 09:00)',
      };
    }

    // Validate end time is after start time
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (endMins <= startMins) {
      return {
        success: false,
        error: 'Closing time must be after opening time',
      };
    }
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Config');
    const data = configSheet.getDataRange().getValues();

    // Map setting keys to config keys
    const settingsMap = {
      slotDuration: 'slot_duration_min',
      gracePeriod: 'grace_period_min',
      startTime: 'start_time',
      endTime: 'end_time',
    };

    // Find rows for each setting
    const rowMap = {};
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      rowMap[key] = i + 1;
    }

    // Update each provided setting
    for (const [jsKey, configKey] of Object.entries(settingsMap)) {
      if (settings[jsKey] !== undefined) {
        const value = settings[jsKey];

        if (rowMap[configKey]) {
          configSheet.getRange(rowMap[configKey], 2).setValue(value);
        } else {
          configSheet.appendRow([configKey, value]);
        }
      }
    }

    // Clear config cache
    clearConfigCache();

    return { success: true, message: 'Settings updated successfully' };
  } catch (e) {
    Logger.log('Error updating settings: ' + e.message);
    return { success: false, error: 'Failed to update settings' };
  }
}

// ============================================
// UTILITY FUNCTIONS FOR ADMIN
// ============================================

/**
 * Manually clear all caches - run from Script Editor if needed
 */
function clearAllCaches() {
  const cache = CacheService.getScriptCache();
  cache.removeAll([CACHE_KEYS.CONFIG]);
  invalidateSlotsCache();
  Logger.log('All caches cleared');
}

/**
 * Test function to verify caching is working
 */
function testCachePerformance() {
  const start1 = new Date();
  clearConfigCache();
  const config1 = getConfig(); // Cold read
  const time1 = new Date() - start1;

  const start2 = new Date();
  const config2 = getConfig(); // Cached read
  const time2 = new Date() - start2;

  Logger.log(`Cold config read: ${time1}ms, Cached read: ${time2}ms`);
  Logger.log(
    `Cache speedup: ${Math.round(time1 / Math.max(time2, 1))}x faster`
  );
}
