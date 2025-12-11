// Background service worker for handling alarms and notifications

const STORAGE_KEY = "reminders";

/**
 * Get all reminders from storage
 * @returns {Promise<Array>} Array of reminder objects
 */
async function getAllReminders() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const reminders = result[STORAGE_KEY];
    return Array.isArray(reminders) ? reminders : [];
  } catch (error) {
    console.error("Error getting reminders:", error);
    return [];
  }
}

/**
 * Update reminder status
 * @param {string} id - Reminder ID
 * @param {string} status - New status ("active", "completed", "dismissed")
 */
async function updateReminderStatus(id, status) {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find((r) => String(r.id) === String(id));
    
    if (reminder) {
      reminder.status = status;
      const index = reminders.findIndex((r) => String(r.id) === String(id));
      if (index >= 0) {
        reminders[index] = reminder;
        await chrome.storage.local.set({ [STORAGE_KEY]: reminders });
      }
    }
  } catch (error) {
    console.error("Error updating reminder status:", error);
  }
}

/**
 * Parse alarm name to extract reminder ID and scheduled time
 * Format: "reminder-{id}-{scheduledTime}"
 * @param {string} alarmName - Alarm name
 * @returns {Object|null} Object with reminderId and scheduledTime, or null if invalid
 */
function parseAlarmName(alarmName) {
  if (!alarmName || !alarmName.startsWith("reminder-")) {
    return null;
  }
  
  const lastDashIndex = alarmName.lastIndexOf("-");
  if (lastDashIndex === -1 || lastDashIndex <= 8) {
    return null;
  }
  
  const timeString = alarmName.substring(lastDashIndex + 1);
  const scheduledTime = parseInt(timeString, 10);
  if (isNaN(scheduledTime) || scheduledTime <= 0) {
    return null;
  }
  
  const reminderId = String(alarmName.substring(8, lastDashIndex)).trim();
  if (!reminderId || reminderId.length === 0) {
    return null;
  }
  
  return { reminderId, scheduledTime };
}

/**
 * Find reminder by ID or scheduled time
 * @param {Array} reminders - Array of reminder objects
 * @param {string} reminderId - Reminder ID to search for
 * @param {number} scheduledTime - Scheduled time timestamp
 * @returns {Object|undefined} Found reminder or undefined
 */
function findReminder(reminders, reminderId, scheduledTime) {
  // Try exact ID match first
  let reminder = reminders.find(r => String(r.id) === String(reminderId));
  
  // Fallback: find by scheduled time (within 1 second tolerance)
  if (!reminder) {
    reminder = reminders.find(r => {
      const rTime = Number(r.scheduledTime);
      const alarmTime = Number(scheduledTime);
      return Math.abs(rTime - alarmTime) < 1000;
    });
  }
  
  return reminder;
}

/**
 * Show notification for a reminder
 * @param {Object} reminder - Reminder object
 */
async function showNotification(reminder) {
  const notificationId = `reminder-${reminder.id}`;
  
  try {
    const permission = await chrome.notifications.getPermissionLevel();
    if (permission === "denied") {
      console.error("Notification permission denied");
      return;
    }
    
    const iconUrl = chrome.runtime.getURL("icons/icon48.png");
    
    await chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: iconUrl,
      title: "NotifyBuddy Reminder",
      message: reminder.text,
      priority: 2,
    });
  } catch (error) {
    console.error("Failed to show notification:", error.message);
    // Try fallback without icon
    try {
      await chrome.notifications.create(`fallback-${notificationId}`, {
        type: "basic",
        title: "NotifyBuddy Reminder",
        message: reminder.text,
        priority: 2,
      });
    } catch (fallbackError) {
      console.error("Fallback notification failed:", fallbackError.message);
    }
  }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  // Extension installed - no action needed
});

// Alarm event handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name || !alarm.name.startsWith("reminder-")) {
    return;
  }
  
  try {
    const parsed = parseAlarmName(alarm.name);
    if (!parsed) {
      console.error("Invalid alarm name format:", alarm.name);
      return;
    }
    
    const { reminderId, scheduledTime } = parsed;
    const reminders = await getAllReminders();
    
    if (reminders.length === 0) {
      return;
    }
    
    const reminder = findReminder(reminders, reminderId, scheduledTime);
    
    if (!reminder) {
      console.error("Reminder not found for alarm:", alarm.name);
      return;
    }
    
    if (reminder.status !== "active") {
      return;
    }
    
    await showNotification(reminder);
    await updateReminderStatus(reminder.id, "completed");
  } catch (error) {
    console.error("Error handling alarm:", error.message);
  }
});

// Notification click handler - open options page
chrome.notifications.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Notification closed handler
chrome.notifications.onClosed.addListener(() => {
  // Notification closed - no cleanup needed
});
