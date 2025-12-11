// Storage utilities for reminders

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
 * Get a single reminder by ID
 * @param {string} id - Reminder ID
 * @returns {Promise<Object|null>} Reminder object or null
 */
async function getReminder(id) {
  if (!id) return null;
  const reminders = await getAllReminders();
  return reminders.find((r) => String(r.id) === String(id)) || null;
}

/**
 * Normalize reminder data types to ensure consistency
 * @param {Object} reminder - Reminder object
 * @returns {Object} Normalized reminder object
 */
function normalizeReminder(reminder) {
  return {
    ...reminder,
    scheduledTime: Number(reminder.scheduledTime) || 0,
    createdAt: Number(reminder.createdAt) || Date.now(),
    status: reminder.status || "active",
  };
}

/**
 * Validate reminder object
 * @param {Object} reminder - Reminder object to validate
 * @throws {Error} If reminder is invalid
 */
function validateReminder(reminder) {
  if (!reminder || typeof reminder !== "object") {
    throw new Error("Invalid reminder object");
  }
  if (!reminder.id || typeof reminder.id !== "string") {
    throw new Error("Reminder must have a valid ID");
  }
  if (!reminder.text || typeof reminder.text !== "string" || reminder.text.trim().length === 0) {
    throw new Error("Reminder text cannot be empty");
  }
  const scheduledTime = Number(reminder.scheduledTime);
  if (!scheduledTime || scheduledTime <= Date.now()) {
    throw new Error("Reminder must be scheduled for a future time");
  }
  const validStatuses = ["active", "completed", "dismissed"];
  if (reminder.status && !validStatuses.includes(reminder.status)) {
    throw new Error(`Invalid status: ${reminder.status}`);
  }
}

/**
 * Save a reminder to storage (create or update)
 * @param {Object} reminder - Reminder object
 * @throws {Error} If reminder is invalid
 */
async function saveReminder(reminder) {
  try {
    validateReminder(reminder);
    const normalizedReminder = normalizeReminder(reminder);
    
    const reminders = await getAllReminders();
    const existingIndex = reminders.findIndex((r) => String(r.id) === String(normalizedReminder.id));
    
    if (existingIndex >= 0) {
      reminders[existingIndex] = normalizedReminder;
    } else {
      reminders.push(normalizedReminder);
    }
    
    await chrome.storage.local.set({ [STORAGE_KEY]: reminders });
  } catch (error) {
    console.error("Error saving reminder:", error);
    throw error;
  }
}

/**
 * Delete a reminder by ID
 * @param {string} id - Reminder ID
 * @throws {Error} If deletion fails
 */
async function deleteReminder(id) {
  if (!id) return;
  
  try {
    const reminders = await getAllReminders();
    const filtered = reminders.filter((r) => String(r.id) !== String(id));
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    throw error;
  }
}

/**
 * Update reminder status
 * @param {string} id - Reminder ID
 * @param {string} status - New status ("active", "completed", "dismissed")
 * @throws {Error} If status is invalid or update fails
 */
async function updateReminderStatus(id, status) {
  if (!id || !status) return;
  
  const validStatuses = ["active", "completed", "dismissed"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  
  try {
    const reminder = await getReminder(id);
    if (reminder) {
      reminder.status = status;
      await saveReminder(reminder);
    }
  } catch (error) {
    console.error("Error updating reminder status:", error);
    throw error;
  }
}
