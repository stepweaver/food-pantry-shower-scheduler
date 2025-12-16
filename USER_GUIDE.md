# Shower Booking System — Easy User Guide

## Welcome

This guide explains how to use the Mishawaka Food Pantry Shower Booking System. Everything is written in plain language so anyone can follow along.

**What this system does:** Book a shower time from your phone. You don't have to wait at the pantry all day. Pick a time, leave, and come back when it's your turn.

---

## Part 1: For People Booking Showers

### When Can I Book a Shower?

- **Days:** Monday through Friday only (no weekends)
- **Booking opens:** 30 minutes before the first shower time
  - Example: If showers start at 10:00 AM, you can start booking at 9:30 AM
- **Booking closes:** When the last shower time has passed
- **Limit:** You can only book ONE shower per day

### Step-by-Step: How to Book a Shower

#### Step 1: Open the Website

Open the shower booking website on your phone. You can:

- Visit the Food Pantry website and click "Shower Scheduling"
- Scan the QR code on the sign at the pantry
- Type the web address directly into your phone's browser

#### Step 2: Enter Your Phone Number

When the page loads, you'll see a box to enter your phone number.

1. Tap the phone number box
2. Type your 10-digit phone number (example: 574-555-1234)
3. You won't have to type it again next time

**Why do we need your phone number?**

- It connects you to your booking
- It makes sure each person only books one shower per day
- Your number is deleted every night for privacy

#### Step 3: Pick a Time

After entering your phone number, you'll see the available shower times.

1. Look at the list of time slots (example: 10:00 AM, 10:30 AM, 11:00 AM)
2. Tap the time you want

**Only available times are shown.** If a time slot is already taken, it won't appear in the list. What you see is what's available — no need to guess.

**Don't see any times listed?**

- **"Booking opens at..."** — It's too early. Come back at the time shown in the message.
- **"No times available"** — All slots for today are booked or have passed.
- **Weekend message** — Showers are only available Monday through Friday.

#### Step 4: See Your Confirmation

After you pick a time, you'll see:

- **Your shower time** — the time you booked
- **A countdown** — shows how long until your shower

You can close the page and come back later to check in.

#### Step 5: Come Back at Your Scheduled Time

Here's the best part — **you can book from anywhere!** You don't need to be at the pantry to reserve a time. Book from home, the library, or wherever you are.

Just make sure to **arrive at the pantry within 10 minutes of your scheduled time** to check in.

Example: If your shower is at 9:00 AM:

- Arrive between 8:50 AM and 9:10 AM
- Don't arrive at 9:30 AM — your slot will expire

---

### Step-by-Step: How to Check In

When you return for your shower, you need to check in.

#### Step 1: Open the Website Again

Go back to the same website you used to book.

#### Step 2: See Your Status

The page will automatically show:

- Your booked time
- A countdown to your slot
- Whether you can check in yet

#### Step 3: Wait for the Check-In Window

You can check in starting **10 minutes before** your scheduled time.

Example: If your shower is at 10:00 AM:

- You can check in starting at 9:50 AM
- The "Check In" button appears when you're in the window

#### Step 4: Tap "Check In"

1. When the button turns green, tap **"I'm Here — Check In Now"**
2. You'll see a confirmation message
3. Now wait to be called by staff

**If you're too early:** The button will be gray and tell you to come back closer to your time.

**If you're too late:** See the section below about expired reservations.

---

### What Happens If I'm Late? (Expired Reservations)

Life happens. If you're late, here's what to know:

#### The Grace Period

You have a **10-minute grace period** after your scheduled time.

Example: If your shower is at 11:00 AM:

- ✅ 10:50 AM to 11:10 AM — You can still check in
- ❌ After 11:10 AM — Your reservation expires

#### What "Expired" Means

If you don't check in within the grace period:

- Your slot is marked as "expired"
- You'll see a message that says your slot expired
- The time slot is NOT re-released (since it has already passed)

#### Good News: You Can Book Again!

If your reservation expires, **you can book a new time** — as long as there are still slots available for the day.

1. The website will show you a message that your slot expired
2. Tap the button to book a new time
3. Pick from any available remaining time slots
4. Follow the same check-in process

**Remember:** You still get only ONE active booking at a time. But if your first one expires, you're allowed to try again.

---

### Tips for Success

1. **Set an alarm** on your phone for 15 minutes before your shower time
2. **Save the website** to your phone's home screen for quick access
3. **Come a little early** — you can check in starting 10 minutes before
4. **If plans change**, cancel your reservation so someone else can use it (see below)
5. **Same phone, same number** — always use the same phone number so the system recognizes you

---

### How to Cancel Your Reservation

If your plans change, **please cancel** so someone else can use your slot.

1. Go back to the booking website
2. Tap the red **"Cancel Reservation"** button
3. Tap **OK** to confirm

The slot will be released for others to book (as long as that time hasn't already passed).

---

### Common Questions

**Q: What if the website says booking is closed?**
A: Booking opens 30 minutes before the first shower time. If you see this message, either:

- It's too early — come back closer to opening time
- It's a weekend or holiday — showers are only available during business hours
- All times for today are over — try again tomorrow

**Q: I booked but forgot my time. How do I check?**
A: Just visit the website again using the same phone number. It will show your booking automatically.

**Q: Can I cancel my booking?**
A: Yes! Tap "Cancel Reservation" on your status page. See the section above for details.

**Q: My phone died / I lost my phone. Can I still use my shower?**
A: Yes! Go to the pantry and tell staff your phone number. They can check you in from their dashboard.

**Q: How do I know staff called me?**
A: After you check in, stay nearby. Staff will call you when a shower is ready.

---

## Part 2: For Staff Members

### Accessing the Staff Dashboard

1. Open your web browser
2. Go to: `[Your Web App URL]?page=admin&key=[your-admin-key]`
3. Replace `[your-admin-key]` with the password set in the Config sheet

**Tip:** Bookmark this page for quick access.

### What You'll See

The staff dashboard shows:

- **Today's date and time**
- **All bookings for today** in time order
- **Each person's status:**
  - 🔵 **Booked** — Reserved but not checked in yet
  - 🟢 **Checked In** — They're here and waiting
  - ⚪ **Expired** — They didn't show up in time
  - ❌ **Cancelled** — Booking was cancelled

### Actions You Can Take

For each booking, you can:

1. **Check In** — Manually check someone in (if they can't use their phone)
2. **No-Show** — Mark as expired if they didn't come
3. **Cancel** — Cancel the booking entirely

### Opening and Closing Bookings

At the top of the dashboard, you can:

1. **Close Bookings** — Temporarily stop new bookings
   - A message box lets you explain why (example: "Plumbing issue today")
   - People trying to book will see your message
2. **Open Bookings** — Resume normal booking

### Manually Updating Status in the Spreadsheet

Sometimes you may need to update a guest's status directly in Google Sheets — for example, if the dashboard isn't loading or you need to make a bulk change.

#### How to Change a Guest's Status

1. Open your Google Spreadsheet
2. Click on the **Slots** tab at the bottom
3. Find the guest's row (by phone number or time)
4. Click on the **status** cell (column D)
5. Use the dropdown to select the new status:
   - `booked` — Waiting to check in
   - `checked_in` — They're here and waiting for a shower
   - `expired` — They didn't show up (no-show)
   - `cancelled` — Booking was cancelled

#### Setting Up the Status Dropdown (One-Time Setup)

If the dropdown isn't working yet, here's how to set it up:

1. Open the Slots sheet
2. Select column D (or D2:D1000 to skip the header)
3. Go to **Data** → **Data validation**
4. Click **Add rule**
5. Set criteria to **Dropdown**
6. Add these values (one per line):
   - `booked`
   - `checked_in`
   - `expired`
   - `cancelled`
7. Check "Show dropdown in cell"
8. Click **Done**

#### Protecting the Sheet (Recommended)

To prevent accidental edits to dates, times, or phone numbers:

1. Go to **Data** → **Protect sheets and ranges**
2. Click **+ Add a sheet or range**
3. Select the **Slots** sheet
4. Click **Except certain cells** and enter `D2:D1000`
5. Click **Set permissions** → choose who can edit (yourself or specific staff)

This lets staff change the status column while protecting everything else.

---

## Part 3: How the System Works Behind the Scenes

This section explains the technical parts of the system for administrators.

### The Google Spreadsheet

Everything is stored in a Google Spreadsheet with two sheets:

#### Sheet 1: "Slots"

This tracks all bookings. Columns are:

| Column        | Letter | What It Holds                             |
| ------------- | ------ | ----------------------------------------- |
| date          | A      | The booking date (2024-01-15)             |
| time          | B      | The shower time (09:00)                   |
| phone         | C      | The person's phone number                 |
| status        | D      | booked / checked_in / expired / cancelled |
| booked_at     | E      | When they made the booking                |
| checked_in_at | F      | When they checked in                      |

**Note:** The status column (D) can be set up as a dropdown for easy manual updates. See "Manually Updating Status in the Spreadsheet" in Part 2.

#### Sheet 2: "Config"

This controls how the system works. Here's what each setting does:

| Setting                | What It Means                                                         | Example                             |
| ---------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| slot_duration_min      | How long each shower slot is (in minutes)                             | 30                                  |
| grace_period_min       | How late someone can be and still check in (in minutes)               | 10                                  |
| start_time             | When the first shower is available                                    | 7:00                                |
| end_time               | When the last shower slot ends                                        | 14:00                               |
| slots_per_time         | How many people can book the same time (if you have multiple showers) | 1                                   |
| admin_key              | The password for the staff dashboard                                  | mishawaka2025                       |
| timezone               | Your location's timezone                                              | America/Indiana/Indianapolis        |
| weekdays_only          | Only allow booking Monday-Friday (checkbox)                           | ☑ checked                           |
| booking_enabled        | Master on/off switch for bookings (checkbox)                          | ☑ checked                           |
| booking_closed_message | Message shown when bookings are closed                                | (leave empty or add custom message) |
| debug_mode             | Turn on extra logging for troubleshooting (checkbox)                  | ☐ unchecked                         |
| rate_limit_enabled     | Prevent spam/abuse (checkbox)                                         | ☑ checked                           |

### How to Change Settings in the Config Tab

1. Open your Google Spreadsheet
2. Click on the **Config** tab at the bottom
3. Find the setting you want to change in column A
4. Change the value in column B
5. Changes take effect within 5 minutes (or immediately if you clear the cache)

**Common changes:**

- **Change operating hours:** Edit `start_time` and `end_time`
- **Change how long showers are:** Edit `slot_duration_min`
- **Give people more time to arrive:** Increase `grace_period_min`
- **Have 2 showers available at once:** Set `slots_per_time` to 2
- **Allow weekend bookings:** Uncheck `weekdays_only`
- **Close bookings temporarily:** Uncheck `booking_enabled`

### Automatic Triggers

The system has two automatic processes that run without you doing anything:

#### 1. Auto-Expiration (Runs Every 5 Minutes)

**What it does:**

- Checks all bookings marked as "booked"
- If their time has passed (plus the grace period), marks them as "expired"
- This frees up the slot so someone else could book it

**Example:**

- Someone books the 10:00 AM slot
- They don't show up
- At 10:15 AM (after the 10-minute grace period), the system marks them as "expired"
- The 10:00 AM slot is NOT re-released because that time has already passed

#### 2. Daily Cleanup (Runs Every Morning at 6 AM)

**What it does:**

- Deletes all bookings from previous days
- Keeps the spreadsheet clean and small
- Protects privacy by removing old phone numbers

**This means:**

- You don't need to manually clean the spreadsheet
- Each day starts fresh
- Phone numbers are only stored for one day

### How to Set Up These Triggers (First Time Only)

If you're setting up the system for the first time:

1. Open the Google Spreadsheet
2. Click **Extensions** → **Apps Script**
3. In the Apps Script editor, click the **clock icon** on the left (Triggers)
4. Click **+ Add Trigger** in the bottom right

**For Auto-Expiration:**

- Choose function: `autoExpireSlots`
- Select event source: Time-driven
- Select type: Minutes timer
- Select interval: Every 5 minutes
- Click Save

**For Daily Cleanup:**

- Click **+ Add Trigger** again
- Choose function: `dailyMaintenance`
- Select event source: Time-driven
- Select type: Day timer
- Select time: 6am to 7am
- Click Save

---

## Part 4: Troubleshooting Common Problems

### "The page won't load"

**Try these steps:**

1. Make sure you have an internet connection
2. Try refreshing the page
3. Try a different browser (Chrome usually works best)
4. Clear your browser's cache and try again

### "I can't see any available times"

**This could mean:**

- All times for today are already booked or have passed
- It's past the last shower time for today — come back tomorrow
- Booking hasn't opened yet — booking opens 30 minutes before the first shower time
- It's a weekend — showers are Monday-Friday only

### "My booking expired but I was on time"

**Check these things:**

- Were you checking in on the same phone with the same number?
- Was your phone's clock correct?
- Did you actually tap the "Check In" button?

**If the system made a mistake:** Staff can manually mark you as checked in from the admin dashboard.

### "The system says I already have a booking"

**This means:**

- You already booked a shower today using this phone number
- The system only allows ONE booking per phone number per day
- If your previous booking expired, the message should let you book again

### "Config changes aren't working"

**Wait 5 minutes** — the system caches settings to run faster. Changes apply within 5 minutes.

**Or clear the cache manually:**

1. Open Apps Script (Extensions → Apps Script)
2. In the code editor, find the function `clearAllCaches` in the function dropdown
3. Click the Run button (▶️) to execute it
4. Changes apply immediately

**Note:** You may need to authorize the script the first time you run it manually.

---

## Quick Reference Card

### For People Booking Showers

| What            | When/How                                        |
| --------------- | ----------------------------------------------- |
| Booking opens   | 30 minutes before first shower                  |
| Booking closes  | After last shower time                          |
| Check-in window | 10 minutes before to 10 minutes after your time |
| If you're late  | Your slot expires, but you can book again       |
| To cancel       | Tap "Cancel Reservation" on your status page    |
| Limit           | 1 shower per day per phone number               |

### For Staff

| Task                   | How                                               |
| ---------------------- | ------------------------------------------------- |
| View bookings          | Open admin dashboard                              |
| Check someone in       | Tap "Check In" next to their name                 |
| Mark complete          | Tap "Complete" after their shower                 |
| Close bookings         | Toggle "Close Bookings" and add a message         |
| Update status manually | In Slots sheet, use dropdown in column D (status) |

### Config Quick Reference

| Setting           | Default | What It Does        |
| ----------------- | ------- | ------------------- |
| slot_duration_min | 30      | Minutes per shower  |
| grace_period_min  | 10      | Late arrival window |
| start_time        | 7:00    | First shower time   |
| end_time          | 14:00   | Last shower start   |
| slots_per_time    | 1       | Concurrent bookings |
| weekdays_only     | ☑       | Monday-Friday only  |

---

## Need More Help?

- **For booking help:** Ask staff at the pantry
- **For technical issues:** Contact your system administrator
- **For setup help:** See the SETUP_GUIDE.md file

---

_This guide was created for the Mishawaka Food Pantry Shower Booking System. Last updated: January 2025 (v1.2)_
