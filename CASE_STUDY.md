# Mishawaka Food Pantry Shower Booking System - Case Study

## Executive Summary

The Mishawaka Food Pantry Shower Booking System is a self-service appointment scheduling solution built entirely with Google Apps Script. This zero-cost, zero-infrastructure system solved a critical operational problem: homeless individuals waiting around all day hoping to get a shower, which forced the pantry to discontinue shower services entirely.

**The Solution:** A mobile-first web application that lets users book specific time slots from their phones, leave, and return within 10 minutes of their scheduled time. No waiting required. No staff tablets. No SMS costs.

## The Problem

### Operational Challenge

The Mishawaka Food Pantry had to discontinue their shower services because homeless individuals were waiting around all day hoping to get a shower. This created several problems:

1. **Safety Concerns:** Large groups of people congregating outside the pantry all day
2. **Resource Strain:** Staff couldn't manage the constant flow of people hoping for showers
3. **Inefficiency:** People wasting entire days waiting for a service that might not be available
4. **Service Disruption:** The pantry had to completely stop offering showers

### Technical Constraints

The solution needed to be:
- **Zero Cost:** No budget for hosting, SMS services, or infrastructure
- **Zero Infrastructure:** No servers, databases, or technical maintenance
- **Mobile-First:** Users only have phones, no computers
- **No Staff Hardware:** Staff couldn't manage tablets or devices
- **Easy Handover:** Must run entirely in the pantry's Google account
- **Privacy-Focused:** Phone numbers should be deleted nightly

## The Solution

### Architecture Overview

A complete booking system built entirely within Google Apps Script, deployed as a web app:

- **Backend:** Google Apps Script (Code.gs) - handles all business logic, data storage, and API endpoints
- **Frontend:** HTML/CSS/JavaScript (booking.html) - mobile-first PWA interface
- **Admin Dashboard:** HTML/CSS/JavaScript (admin.html) - staff management interface
- **Data Storage:** Google Sheets - acts as the database (Slots and Config sheets)
- **Deployment:** Google Apps Script Web App - free hosting with automatic scaling

### Key Design Decisions

1. **Google Sheets as Database:** Eliminates need for a separate database while providing familiar interface for staff
2. **PWA Architecture:** Installable on phones for quick access, works offline
3. **Phone Number as Identifier:** No accounts needed, phone numbers remembered in browser localStorage
4. **Check-In Code System:** 6-character codes for verification without exposing phone numbers
5. **Auto-Expiration:** Unclaimed slots automatically released after grace period
6. **Server-Side Caching:** CacheService dramatically improves performance on free hosting

## Technical Implementation

### Core Features

#### 1. Booking Flow
- Users enter phone number (saved in browser localStorage)
- System checks for existing booking for that phone number today
- Shows available time slots (30-minute windows)
- User selects slot and receives unique 6-character check-in code
- User can leave and return later

#### 2. Status Tracking
- Users revisit the page - phone number auto-detected
- Shows countdown to scheduled time
- Check-in button becomes available 10 minutes before slot time
- Real-time status updates every 30 seconds

#### 3. Check-In System
- Check-in window: 10 minutes before through 10 minutes after scheduled time
- Users tap "Check In" when they arrive
- Staff sees checked-in users on admin dashboard
- Unclaimed slots automatically expire after grace period

#### 4. Admin Dashboard
- View all today's bookings with statuses
- See who's waiting, who's checked in
- Manual actions: check in, mark complete, mark no-show, cancel
- Open/close booking system with custom messages
- Real-time updates every 30 seconds

### Performance Optimizations

#### Server-Side Caching
- **Config Cache:** 5-minute TTL (config rarely changes)
- **Slots Cache:** 30-second TTL (slots change with bookings)
- **Rate Limit Cache:** 1-minute TTL (abuse prevention)

#### Batch Operations
- Combined API calls reduce round trips
- Single `apiGetInitialData()` call loads booking status, current time, and phone lookup
- Admin dashboard uses `apiGetAdminInitialData()` for single-call initialization

#### LockService Protection
- Prevents race conditions on concurrent bookings
- Ensures atomic slot booking operations
- 10-second lock timeout prevents deadlocks

### Security Features

1. **Rate Limiting:** Prevents booking abuse
   - Max 5 booking attempts per phone per minute
   - Max 20 lookups per minute per IP
   - Max 30 admin actions per minute

2. **Constant-Time Comparison:** Prevents timing attacks on admin authentication

3. **Server-Side Validation:** All inputs validated server-side

4. **Privacy:** Phone numbers deleted nightly via automated trigger

5. **LockService:** Prevents double-bookings and race conditions

### Automated Maintenance

#### Auto-Expiration Trigger (Every 5 Minutes)
- Scans all "booked" slots
- Marks as "expired" if grace period has passed
- Releases slots for others to book

#### Daily Cleanup Trigger (6 AM Daily)
- Deletes all rows older than today
- Clears all caches
- Maintains database performance

## User Experience

### Mobile-First Design

- **PWA Support:** Installable on phones for quick access
- **Responsive Layout:** Works on any screen size
- **Touch-Optimized:** Large buttons, easy tap targets
- **Offline Capable:** Service worker caches for offline access

### User Flow

1. **First Visit:**
   - User visits booking page
   - Enters phone number
   - Sees available slots
   - Books slot, receives confirmation code
   - **Can leave immediately** - no waiting required

2. **Return Visit:**
   - User revisits page
   - Phone number auto-detected from localStorage
   - Sees status: countdown, check-in button when available
   - Taps "Check In" when arriving at pantry
   - Waits to be called by staff

3. **Staff Flow:**
   - Staff opens admin dashboard
   - Sees all bookings with statuses
   - Sees who's checked in and waiting
   - Marks complete when done
   - Can manually check in users if needed

## Configuration System

All settings configurable via Google Sheets Config sheet - no code changes needed:

- `slot_duration_min`: Minutes per slot (default: 30)
- `grace_period_min`: Check-in window after slot time (default: 10)
- `start_time`: First available slot (24h format, default: 10:00)
- `end_time`: Last slot start time (default: 14:00)
- `slots_per_time`: Concurrent showers available (default: 1)
- `weekdays_only`: Block weekend booking (default: TRUE)
- `booking_enabled`: Master on/off switch (default: TRUE)
- `booking_closed_message`: Custom message when closed
- `admin_key`: Staff dashboard password
- `timezone`: Timezone for date/time calculations
- `rate_limit_enabled`: Enable abuse prevention (default: TRUE)

## Integration Features

### Host Site Integration

The system supports integration with host websites (like Next.js sites) via a config endpoint:

```
GET [Web App URL]?action=config
```

Returns:
```json
{
  "booking_enabled": true,
  "booking_closed_message": "Shower bookings are currently closed..."
}
```

This allows host sites to:
- Check booking status before loading the booking interface
- Display custom "closed" messages when bookings are disabled
- Fail open (default to enabled) if config check fails

## Outcomes

### Operational Impact

1. **Service Restored:** Pantry can now offer showers again without operational chaos
2. **Reduced Congestion:** No more people waiting around all day
3. **Better Resource Management:** Staff can plan and manage shower availability
4. **Improved User Experience:** Users can book and leave, return at scheduled time

### Technical Achievements

1. **Zero Infrastructure Cost:** Entire system runs on free Google services
2. **Zero Maintenance:** Automated triggers handle cleanup and expiration
3. **High Performance:** Caching and optimizations make it fast despite free hosting
4. **Scalable:** Handles concurrent bookings with LockService protection
5. **Privacy-Focused:** Phone numbers deleted nightly, minimal data retention

### User Benefits

1. **No Waiting:** Users can leave and return at scheduled time
2. **Convenience:** Phone number remembered, no re-entry needed
3. **Transparency:** Real-time status updates, clear countdown
4. **Reliability:** Auto-expiration ensures fair slot distribution

## Technical Stack

### Backend
- **Google Apps Script:** Server-side logic and API endpoints
- **Google Sheets:** Data storage (Slots and Config sheets)
- **CacheService:** Server-side caching for performance
- **LockService:** Race condition prevention
- **Utilities:** Date/time handling, code generation

### Frontend
- **HTML5/CSS3:** Semantic markup and modern styling
- **Vanilla JavaScript:** No frameworks, minimal dependencies
- **Service Worker:** PWA support and offline caching
- **localStorage:** Client-side phone number persistence

### Deployment
- **Google Apps Script Web App:** Free hosting with automatic scaling
- **Triggers:** Automated maintenance (every 5 minutes and daily)

## Lessons Learned

### What Worked Well

1. **Google Sheets as Database:** Familiar interface for staff, no database setup needed
2. **PWA Architecture:** Installable on phones, feels like native app
3. **Caching Strategy:** Dramatically improved performance on free hosting
4. **Phone Number as ID:** No accounts needed, simple user experience
5. **Auto-Expiration:** Prevents slot hoarding, ensures fair distribution

### Challenges Overcome

1. **Apps Script Latency:** Solved with aggressive caching and batch operations
2. **Race Conditions:** LockService prevents double-bookings
3. **Mobile Experience:** PWA features make it feel native
4. **Privacy Concerns:** Nightly deletion of phone numbers addresses concerns

### Future Enhancements

Potential improvements (not implemented):
- SMS notifications (would require Twilio integration and cost)
- Email confirmations (would require email service)
- Multi-day booking (currently one booking per day)
- Recurring bookings (for regular users)

## Conclusion

The Mishawaka Food Pantry Shower Booking System demonstrates that complex, production-ready applications can be built entirely on free platforms with zero infrastructure costs. By leveraging Google Apps Script, Google Sheets, and modern web technologies, we created a solution that:

- Solves a real operational problem
- Costs nothing to run
- Requires no technical maintenance
- Provides excellent user experience
- Respects user privacy

This project showcases the power of creative problem-solving and leveraging free tools to build impactful solutions for community organizations.

