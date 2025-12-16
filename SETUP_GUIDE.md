# Shower Booking System - Setup Guide

## For Mishawaka Food Pantry Staff

This guide walks you through setting up the shower booking system. It takes about 15-20 minutes.

---

## What This System Does

The pantry discontinued showers because people were waiting around all day. This system solves that by letting people:

1. **Book a specific time slot** from their own phone
2. **Leave and come back** — no need to wait at the pantry
3. **Check their status** anytime on the same page
4. **Check in** when they return within 10 minutes of their slot

**Key features:**

- One booking per phone number per day (prevents hoarding)
- Unclaimed slots automatically release after 10 minutes
- Phone numbers deleted nightly (privacy)
- Staff dashboard to manage check-ins
- No SMS required — all web-based
- No tablets needed — users use their own phones
- Phone number remembered in browser (no re-entry needed)

---

## What You'll Need

- A Google account (the pantry's main account is best)
- About 20 minutes
- The code files from this folder

---

## Step 1: Create the Google Sheet

1. Go to **[sheets.google.com](https://sheets.google.com)**
2. Click **+ Blank** to create a new spreadsheet
3. Name it: `Shower Booking System` (click "Untitled spreadsheet" at top)

### Set up the Slots sheet

The first sheet tab is already created. Rename it:

1. Right-click the tab at the bottom (probably says "Sheet1")
2. Click **Rename**
3. Type: `Slots`

Add these column headers in **Row 1**:
| Column | Header |
|--------|--------|
| A1 | date |
| B1 | time |
| C1 | phone |
| D1 | code |
| E1 | status |
| F1 | booked_at |
| G1 | checked_in_at |

### Create the Config sheet

1. Click the **+** button at the bottom left to add a new sheet
2. Rename it to: `Config`

Add these settings:

| Row | Column A (setting)     | Column B (value)                                               |
| --- | ---------------------- | -------------------------------------------------------------- |
| 1   | setting                | value                                                          |
| 2   | slot_duration_min      | 30                                                             |
| 3   | grace_period_min       | 10                                                             |
| 4   | start_time             | 10:00                                                          |
| 5   | end_time               | 14:00                                                          |
| 6   | slots_per_time         | 1                                                              |
| 7   | admin_key              | shower2024                                                     |
| 8   | timezone               | America/Indiana/Indianapolis                                   |
| 9   | weekdays_only          | TRUE                                                           |
| 10  | booking_enabled        | TRUE                                                           |
| 11  | booking_closed_message | Shower bookings are currently closed. Please check back later. |
| 12  | debug_mode             | FALSE                                                          |
| 13  | rate_limit_enabled     | TRUE                                                           |

> **Important:** Change `shower2024` to your own secret password for the staff dashboard!

> **Note:** The `booking_enabled` setting lets you temporarily disable bookings. Set to `FALSE` to close bookings. The `weekdays_only` setting blocks booking on weekends (Saturday/Sunday).

---

## Step 2: Add the Code

1. With your spreadsheet open, go to **Extensions > Apps Script**
2. A new tab opens with the script editor

### Add Code.gs

1. You'll see a file called `Code.gs` with some default code
2. **Delete all the default code**
3. Open `Code.gs` from this folder
4. **Copy everything** and paste it into the editor

### Add booking.html

1. Click **File > New > HTML file**
2. When prompted for a name, type: `booking` (don't add .html)
3. **Delete the default content**
4. Open `booking.html` from this folder
5. **Copy everything** and paste it

> **Note:** The booking page handles both booking AND status display. Users can book, view their countdown, and check in—all from the same page. Their phone number is saved in their browser so they don't have to re-enter it.

### Add admin.html

1. Click **File > New > HTML file**
2. Name it: `admin`
3. Delete default content
4. Copy contents from `admin.html` and paste

### Save everything

1. Click **File > Save** (or press Ctrl+S / Cmd+S)
2. Name the project: `Shower Booking`

---

## Step 3: Deploy as Web App

1. In the Apps Script editor, click **Deploy > New deployment**
2. Click the **gear icon** next to "Select type"
3. Choose **Web app**
4. Fill in:
   - **Description:** `Shower Booking v1`
   - **Execute as:** `Me (your email)`
   - **Who has access:** `Anyone`
5. Click **Deploy**
6. Click **Authorize access** when prompted
7. Choose your Google account
8. Click **Advanced > Go to Shower Booking (unsafe)**
   - (It's safe - Google just warns about custom scripts)
9. Click **Allow**

### Copy Your URL

After deploying, you'll see a **Web app URL** like:

```
https://script.google.com/macros/s/ABC123xyz.../exec
```

**Copy this URL** - this is your booking system!

---

## Step 4: Set Up Automatic Triggers

These make the system clean up old bookings and release unclaimed slots.

1. In Apps Script, click the **clock icon** (Triggers) in the left sidebar
2. Click **+ Add Trigger** (bottom right)

### Trigger 1: Auto-Expiration (every 5 minutes)

| Setting      | Value             |
| ------------ | ----------------- |
| Function     | `autoExpireSlots` |
| Deployment   | Head              |
| Event source | Time-driven       |
| Type         | Minutes timer     |
| Interval     | Every 5 minutes   |

Click **Save**

### Trigger 2: Daily Cleanup (every morning)

Click **+ Add Trigger** again:

| Setting      | Value              |
| ------------ | ------------------ |
| Function     | `dailyMaintenance` |
| Deployment   | Head               |
| Event source | Time-driven        |
| Type         | Day timer          |
| Time of day  | 6am to 7am         |

Click **Save**

---

## Step 5: Link from Your Website

### Option A: Add a menu link (Recommended)

In Squarespace:

1. Go to **Pages** in the left menu
2. Click **+ Add Page > Link**
3. Set:
   - **Title:** Shower Scheduling
   - **URL:** (paste your Web App URL)
4. Drag it where you want in the navigation

### Option B: Add a button on a page

In the Squarespace page editor:

1. Add a **Button** block
2. Set the link to your Web App URL
3. Label it: "Book a Shower" or similar

---

## Step 6: Test It!

1. Open your Web App URL on your phone
2. Book a test slot
3. Check the status page works
4. Try the admin dashboard:
   ```
   [Your Web App URL]?page=admin&key=shower2024
   ```
   (Use whatever password you set in Config)

---

## Daily Use

### For Users

1. Visit your booking link on their phone
2. Enter phone number (saved automatically for future visits)
3. Pick an available time slot
4. See confirmation with check-in code
5. **They don't need to wait at the pantry!** They can leave and return later
6. Come back within 10 minutes of scheduled time
7. Revisit the same page—their phone number is remembered
8. Tap "I'm Here — Check In Now" when in the check-in window
9. Wait to be called by staff

### For Staff

1. Open the admin dashboard URL (keep it bookmarked)
2. See who's waiting, who's checked in
3. Manually check in users if needed
4. Mark people complete when they finish
5. Mark no-shows if they don't arrive
6. Open/close booking system from the dashboard

---

## Customization

### Change operating hours

Edit the `Config` sheet:

- `start_time`: When first slot is available (24hr format, e.g., `10:00`)
- `end_time`: When last slot ends (e.g., `14:00` for 2pm)

### Change slot duration

Edit `slot_duration_min` in Config (e.g., `20` for 20-minute slots)

### Change grace period

Edit `grace_period_min` in Config (how long before unclaimed slots expire)

### Change admin password

Edit `admin_key` in Config to any word/phrase you want

### Enable/Disable bookings

Edit `booking_enabled` in Config:

- `TRUE` - Bookings are open (default)
- `FALSE` - Bookings are closed (host sites with config check will show the closed message)

Optionally customize `booking_closed_message` to explain why bookings are closed

---

## Host Site Integration (Advanced)

If you're embedding the booking system on your own website (like a Next.js site), you can implement a **pre-flight config check** to determine whether bookings are enabled before loading the booking interface.

### Config Endpoint

The booking system supports a config endpoint that returns the current booking status:

```
GET [Your Web App URL]?action=config
```

**Example Response:**

```json
{
  "booking_enabled": true,
  "booking_closed_message": "Shower bookings are currently closed. Please check back later."
}
```

### How It Works

1. Your website makes a request to `?action=config` before loading the booking iframe
2. If `booking_enabled` is `true`, load the booking interface normally
3. If `booking_enabled` is `false`, display the `booking_closed_message` instead

### Enabling/Disabling Bookings

To temporarily close bookings:

1. Open your Google Sheet
2. Go to the **Config** sheet
3. Change `booking_enabled` from `TRUE` to `FALSE`
4. Optionally update `booking_closed_message` with a custom message

The host site will immediately start showing the closed message instead of the booking interface.

### Demo Implementation

A working example of this integration is available at:

- **https://stepweaver.dev/book-shower**

This demonstrates how a Next.js site can:

- Check the config endpoint before loading the iframe
- Display a styled "bookings closed" message when disabled
- Fail open (default to enabled) if the config check fails

### Client-Side Implementation Example

```javascript
async function checkBookingEnabled(scriptUrl) {
  try {
    const response = await fetch(`${scriptUrl}?action=config`);
    const data = await response.json();

    // Handle both flat and nested response structures
    const config = data.config || data;

    // Normalize booking_enabled value (handles true/false, "true"/"false", 1/0)
    const enabled =
      config.booking_enabled === true ||
      config.booking_enabled === 'true' ||
      config.booking_enabled === 'TRUE' ||
      config.booking_enabled === 1 ||
      config.booking_enabled === '1';

    return {
      enabled,
      message:
        config.booking_closed_message || 'Bookings are currently closed.',
    };
  } catch (error) {
    // Fail open - if config check fails, allow bookings
    console.error('Config check failed:', error);
    return { enabled: true, message: '' };
  }
}
```

---

## Troubleshooting

### "Script function not found"

Make sure you copied all the code into `Code.gs` correctly.

### "Authorization required"

You need to re-authorize. Go to Deploy > Manage deployments > edit icon > Deploy new version.

### Changes not showing up

After editing code, you must:

1. Save the file
2. Deploy > Manage deployments
3. Click the pencil/edit icon
4. Change version to "New version"
5. Click Deploy

### Users can't access

Check that "Who has access" is set to "Anyone" in deployment settings.

---

## Getting Help

If something isn't working, the Google Sheet logs can help diagnose issues:

1. Go to **View > Logs** in Apps Script
2. Or check **Executions** in the left sidebar

For technical issues, contact the developer who set this up.

---

## Signage for the Pantry

Post this sign where people can see it:

---

### 🚿 SHOWER RESERVATIONS

**To book a shower time:**

1. **Visit on your phone:**
   `themishawakafoodpantry.com/shower`
2. **Pick an available time**

3. **Save your confirmation code**

4. **Return within 10 minutes** of your scheduled time

5. **Check in** on your phone or tell staff your code

---

**You don't need to wait here!**
Check your status page anytime and come back when it's your turn.

_Slots not claimed within 10 minutes are automatically released._

---
