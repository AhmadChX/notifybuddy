// Alarm utilities for scheduling reminders

/**
 * Create alarm name from reminder
 * Format: "reminder-{id}-{scheduledTime}"
 * @param {Object} reminder - Reminder object
 * @returns {string} Alarm name
 */
function createAlarmName(reminder) {
  return `reminder-${reminder.id}-${reminder.scheduledTime}`;
}

/**
 * Schedule an alarm for a reminder
 * @param {Object} reminder - Reminder object
 * @throws {Error} If reminder is invalid or time is in the past
 */
async function scheduleReminder(reminder) {
  if (!reminder || !reminder.id || !reminder.scheduledTime) {
    throw new Error("Invalid reminder object");
  }
  
  const alarmName = createAlarmName(reminder);
  const now = Date.now();
  const scheduledTime = Number(reminder.scheduledTime);
  
  if (scheduledTime <= now) {
    throw new Error("Cannot schedule alarm for past time");
  }
  
  try {
    await chrome.alarms.create(alarmName, {
      when: scheduledTime,
    });
  } catch (error) {
    console.error("Failed to create alarm:", error);
    throw error;
  }
}

/**
 * Cancel an alarm by ID and scheduled time
 * @param {string} id - Reminder ID
 * @param {number} scheduledTime - Scheduled time timestamp
 */
async function cancelReminderById(id, scheduledTime) {
  if (!id || !scheduledTime) return;
  const alarmName = `reminder-${id}-${scheduledTime}`;
  await chrome.alarms.clear(alarmName);
}
