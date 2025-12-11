# NotifyBuddy

A lightweight browser extension for creating time based reminders and receiving notifications directly in your browser. Ideal for quick follow ups like checking emails, monitoring deliveries, or revisiting tasks you want to remember later.

<img width="403" height="505" alt="image" src="https://github.com/user-attachments/assets/e69f2aa7-3ab7-4a5c-9007-8a2f22d7872d" />

## Features

- ⏰ **Time based reminders** Schedule reminders for any future date and time  
- 🔔 **Native notifications** Receive browser notifications at scheduled times  
- 📝 **Quick add** Fast popup interface for creating reminders  
- 🗂️ **Dashboard** View, edit, delete, search, and sort reminders  
- 🔍 **Smart search** Filter by text, date, or status  
- 💾 **Local storage only** All data stored on your device  
- 🔒 **Privacy first** No analytics, tracking, or external requests  

## Privacy Guarantees

✅ **100% Local Storage** - All data stays on your device  
✅ **No Cloud Sync** - Nothing is uploaded to external servers  
✅ **No Data Logging** - No analytics, tracking, or logging of your data  
✅ **No External Requests** - Extension never makes network requests  
✅ **Browser Specific** - Data is tied to your browser profile  

## Data Persistence

- Persists across browser restarts  
- Persists through extension updates  
- Device specific  
- No cross browser or cross device sync  

## Tech Stack

- Manifest V3
- Plain HTML/CSS/JavaScript (no build tools)
- Chrome APIs: Storage, Alarms, Notifications

## Installation

1. Clone or download the repository  
2. Open Chrome and go to `chrome://extensions/`  
3. Enable Developer mode  
4. Click **Load unpacked**  
5. Select the `notifybuddy` folder  
6. The extension icon will appear in your toolbar  

## Usage

### Creating Reminders

1. Click the NotifyBuddy extension icon in your toolbar
2. Enter what you'd like to be reminded about
3. Select a date and time (or use "Set to Next Hour" for quick scheduling)
4. Click **"Create Reminder"**

### Managing Reminders

1. Click **"View All Reminders"** in the popup, or right-click the extension icon and select **"Options"**
2. Use the dashboard to:
   - **Search** - Type to filter reminders by text, date, or status
   - **Sort** - Sort by date, text, status, or creation date
   - **Edit** - Click "Edit" on any active reminder
   - **Dismiss** - Dismiss reminders (with undo option)
   - **Delete** - Permanently remove reminders

### Notifications

- When a reminder's scheduled time arrives, you'll receive a browser notification
- Click the notification to open the options page
- The reminder status automatically changes to "completed" after notification

## Limitations

- Browser must be running for reminders to trigger
- Reminders are device specific (no cross-device sync)

## Project Structure

**manifest.json**
Contains the extension manifest configured for Manifest V3.

**popup folder**
Includes the popup interface used for quick reminder creation:

* popup.html for the UI
* popup.css for styling
* popup.js for form handling and logic

**options folder**
Contains the dashboard and settings page:

* options.html for the dashboard layout
* options.css for dashboard styling
* options.js for reminder management such as CRUD operations, search, and sorting

**background folder**

* service worker responsible for alarms and notifications

**shared folder**
Holds shared modules used across the extension:

* storage.js for storage operations
* alarms.js for scheduling alarms
* utils.js for formatting and validation utilities

**icons folder**
Includes all extension icons: icon16.png, icon48.png, and icon128.png

### **Made with ❤️ for productivity and privacy**
