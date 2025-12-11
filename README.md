# NotifyBuddy

A lightweight browser extension for creating time based reminders and receiving notifications directly in your browser. Ideal for quick follow ups like checking emails, monitoring deliveries, or revisiting tasks you want to remember later.

## Features

- ⏰ **Time based reminders** Schedule reminders for any future date and time  
- 🔔 **Native notifications** Receive browser notifications at scheduled times  
- 📝 **Quick add** Fast popup interface for creating reminders  
- 🗂️ **Dashboard** View, edit, delete, search, and sort reminders  
- 🔍 **Smart search** Filter by text, date, or status  
- 💾 **Local storage only** All data stored on your device  
- 🔒 **Privacy first** No analytics, tracking, or external requests  

### Privacy Guarantees

✅ **100% Local Storage** - All data stays on your device  
✅ **No Cloud Sync** - Nothing is uploaded to external servers  
✅ **No Data Logging** - No analytics, tracking, or logging of your data  
✅ **No External Requests** - Extension never makes network requests  
✅ **Browser Specific** - Data is tied to your browser profile  

### Data Persistence

- Persists across browser restarts  
- Persists through extension updates  
- Device specific  
- No cross browser or cross device sync  

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

## Tech Stack

- Manifest V3
- Plain HTML/CSS/JavaScript (no build tools)
- Chrome APIs: Storage, Alarms, Notifications

## Limitations

- Browser must be running for reminders to trigger
- Minimum 1-minute alarm granularity
- Reminders are device-specific (no cross-device sync)

## Project Structure

notifybuddy/
├── manifest.json # Extension manifest (Manifest V3)
├── popup/
│ ├── popup.html # Popup UI for quick reminder creation
│ ├── popup.css # Popup styles
│ └── popup.js # Popup logic and form handling
├── options/
│ ├── options.html # Dashboard/options page
│ ├── options.css # Dashboard styles
│ └── options.js # Dashboard logic (CRUD, search, sort)
├── background/
│ └── service-worker.js # Background service worker (alarms & notifications)
├── shared/
│ ├── storage.js # Storage utilities (CRUD operations)
│ ├── alarms.js # Alarm scheduling utilities
│ └── utils.js # Shared utility functions (formatting, validation)
└── icons/
├── icon16.png # Extension icons
├── icon48.png
└── icon128.png


**Made with ❤️ for productivity and privacy**