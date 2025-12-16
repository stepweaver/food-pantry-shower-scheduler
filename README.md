# Mishawaka Food Pantry - Shower Booking System

A self-service shower booking system built with Google Apps Script. Solves the "people waiting around all day" problem by letting users book specific time slots from their phones.

**The Problem:** The pantry had to discontinue shower services because homeless individuals were waiting around all day hoping to get a shower.

**The Solution:** Users book a specific time slot, leave, and return within 10 minutes of their scheduled time. No waiting required. No staff tablets. No SMS costs.

## Quick Start

### 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it: `Shower Booking System`
3. Rename the first sheet tab to: `Slots`
4. Add these column headers in row 1:
   - A1: `date`
   - B1: `time`
   - C1: `phone`
   - D1: `status`
   - E1: `booked_at`
   - F1: `checked_in_at`

5. Create a second sheet tab named: `Config`
6. Add these settings:

| Setting | Value | Description |
|---------|-------|-------------|
| `slot_duration_min` | `30` | Minutes per shower slot |
| `grace_period_min` | `10` | Minutes to check in after slot time |
| `start_time` | `10:00` | First available slot (24h format) |
| `end_time` | `14:00` | Last slot start time (24h format) |
| `slots_per_time` | `1` | Concurrent showers available |
| `admin_key` | `your-secure-key` | **Change this!** Staff dashboard password |
| `timezone` | `America/Indiana/Indianapolis` | Your timezone |
| `weekdays_only` | `TRUE` | Only allow Mon-Fri booking |
| `booking_enabled` | `TRUE` | Master on/off switch |
| `booking_closed_message` | *(empty)* | Custom message when closed |
| `debug_mode` | `FALSE` | Enable server-side logging |
| `rate_limit_enabled` | `TRUE` | Enable abuse prevention |

### 2. Add the Apps Script Code

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code in `Code.gs`
3. Copy the entire contents of `Code.gs` from this project and paste it
4. Create new HTML files (File > New > HTML file):
   - `booking.html` - Main booking interface
   - `admin.html` - Staff dashboard
5. Copy the contents from each file in this project

> **Note:** The booking page handles both booking and status display in a single-page experience.

### 3. Deploy as Web App

1. In Apps Script, click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Set:
   - Description: `Shower Booking v1.2`
   - Execute as: `Me`
   - Who has access: `Anyone`
4. Click **Deploy**
5. Copy the Web app URL - this is your booking system!

### 4. Set Up Automatic Triggers

1. In Apps Script, click the clock icon (Triggers) in the left sidebar
2. Click **+ Add Trigger**
3. Create two triggers:

**Auto-Expiration (every 5 minutes):**
- Function: `autoExpireSlots`
- Event source: Time-driven
- Type: Minutes timer
- Interval: Every 5 minutes

**Daily Cleanup (daily at 6 AM):**
- Function: `dailyMaintenance`
- Event source: Time-driven
- Type: Day timer
- Time of day: 6am to 7am

### 5. Link from Your Website

Add a link or button to your Apps Script Web App URL. For example:
- Squarespace: Add a Link item in Navigation
- WordPress: Add to menu or use a button block
- Direct: Share the URL via QR code (see `SIGNAGE.html`)

## Files

| File | Purpose |
|------|---------|
| `Code.gs` | Main Apps Script backend with caching, rate limiting & locking |
| `booking.html` | Public booking page (handles both booking and status) |
| `admin.html` | Staff dashboard for managing bookings |
| `SIGNAGE.html` | Printable sign with QR code placeholder |

## Features

- **No SMS required** - Users check their own status page (no Twilio costs!)
- **No waiting around** - Users leave and come back at their scheduled time
- **Phone number remembered** - Browser localStorage saves their number, no re-entry needed
- **One booking per phone/day** - Prevents slot hoarding
- **Auto-expiration** - Unclaimed slots expire after grace period
- **Mobile-first PWA** - Installable on phones for quick access
- **Privacy-focused** - Phone numbers deleted nightly
- **No staff hardware** - Users use their own phones to book and check in
- **Easy handover** - Runs entirely in Google account
- **Performance optimized** - Server-side caching & combined API calls for faster loading
- **Rate limiting** - Prevents booking abuse
- **Race condition protection** - LockService prevents double-bookings
- **Input validation** - Comprehensive server-side validation for security
- **Batch operations** - Optimized spreadsheet updates for better performance

## How It Works

### User Flow (from their phone)

1. **Visit the booking page** - Opens on pantry website or direct link
2. **Enter phone number** - Saved in browser for future visits
3. **Pick a time slot** - Shows available 30-minute windows
4. **See confirmation** - Booking confirmed with your scheduled time
5. **Leave** - User doesn't need to wait at the pantry!
6. **Return within 10 minutes** of their slot
7. **Revisit the page** - Phone number auto-detected, shows status
8. **Tap "Check In"** - Available 10 min before through 10 min after slot time
9. **Wait to be called** - Staff sees them checked in on dashboard

### Staff Flow (admin dashboard)

1. **View today's bookings** - All slots, statuses, masked phone numbers
2. **See check-in status** - Who's waiting, who's arrived
3. **Manual actions** - Check in, mark complete, mark no-show, cancel
4. **Open/close booking** - Toggle system availability with custom message

## Performance Notes

Google Apps Script has inherent latency (~1-3 seconds for cold starts). This version includes several optimizations:

1. **CacheService**: Config and slot data are cached server-side
2. **Batch reads**: Spreadsheet data is read once and reused
3. **Rate limiting**: Prevents abuse while protecting server resources

**Expected performance:**
- First page load: 2-4 seconds (cold start)
- Subsequent actions: 1-2 seconds (cached)
- Status refresh: <1 second (usually cached)

**Version 1.2 improvements:**
- Enhanced input validation and error handling
- Optimized auto-expiration process
- Better parameter validation for all API endpoints
- Improved code clarity and maintainability

### If It Feels Slow

- This is normal for Apps Script - it's free hosting with trade-offs
- The app is still faster than most alternatives that cost money
- Consider the trade-off: free, fully in your control, vs. paid services

## Customization

### Config Sheet Options

All settings can be changed in the Config sheet without touching code:

| Setting | Default | Notes |
|---------|---------|-------|
| `slot_duration_min` | 30 | Minutes per slot |
| `grace_period_min` | 10 | Check-in window after slot time |
| `start_time` | 10:00 | First slot (24h format) |
| `end_time` | 14:00 | Last slot start time |
| `slots_per_time` | 1 | Parallel shower stalls |
| `weekdays_only` | TRUE | Block weekend booking |
| `rate_limit_enabled` | TRUE | Prevent spam booking |

### Changing Operating Hours

Simply update `start_time` and `end_time` in the Config sheet. Changes take effect within 5 minutes (when cache expires).

### Multiple Showers

Set `slots_per_time` to the number of shower stalls available. The system will allow that many bookings per time slot.

## Admin Dashboard

Access at: `YOUR_URL?page=admin&key=YOUR_ADMIN_KEY`

Features:
- View all today's bookings
- Check in users manually
- Mark as complete, no-show, or cancelled
- Open/close booking system
- Set custom closed messages

## Troubleshooting

### "Script is taking too long"
- Normal for first load of the day
- Wait and retry - caches will warm up

### Bookings not showing
- Check the Slots sheet has correct column headers
- Verify timezone setting matches your location

### Changes to Config not working
- Wait 5 minutes for cache to expire, OR
- Run `clearAllCaches()` from Script Editor (Extensions > Apps Script > Run function > clearAllCaches)

### Need to reset everything
- Run `clearAllCaches()` from Script Editor
- Delete old rows from Slots sheet

## Security Notes

This app is designed for low-stakes community use. A few best practices:

1. **Change the default admin key** - Use something long and random
2. **Access admin on private devices** - The admin URL contains the key in browser history
3. **Use incognito mode for admin** - Prevents the URL from being saved in history
4. **Rotate the admin key periodically** - Update in Config sheet, then clear browser history

The app includes:
- Rate limiting to prevent booking abuse
- Constant-time comparison for admin authentication (prevents timing attacks)
- Comprehensive server-side validation of all inputs
- LockService to prevent race conditions
- Input sanitization for phone numbers
- Error handling for malformed requests
- Batch operations for better performance

## Support

For questions, contact the developer or refer to [Google Apps Script documentation](https://developers.google.com/apps-script).

## Version History

- **v1.2.0** (Current) - Enhanced validation, optimized operations, improved error handling
- **v1.1.0** - Production optimized version with caching and rate limiting
- **v1.0.0** - Initial release

---

*Built with ❤️ for Mishawaka Food Pantry*
