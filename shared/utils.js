// Shared utility functions

/**
 * Format datetime for display (24-hour format)
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string (e.g., "15 Jan 2024 • 14:30")
 */
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${day} ${monthNames[date.getMonth()]} ${year} • ${hours}:${minutes}`;
}

/**
 * Format date only (for created date)
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string (e.g., "Jan 15, 2024")
 */
function formatDateOnly(timestamp) {
  const date = new Date(timestamp);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Get relative time string (e.g., "in 5 minutes", "2 hours ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time string
 */
function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (diff < 0) {
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    return `in ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
}

/**
 * Get minimum datetime for datetime-local input (now + 1 minute)
 * @returns {string} ISO datetime string (YYYY-MM-DDTHH:mm)
 */
function getMinDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  return now.toISOString().slice(0, 16);
}

/**
 * Get datetime for next hour (+1 hour from now, rounded to hour)
 * Returns in local time format for datetime-local input
 * @returns {string} Local datetime string (YYYY-MM-DDTHH:mm)
 */
function getNextHourDateTime() {
  const now = new Date();
  
  // Add 1 hour (3600000 milliseconds) to current time
  const nextHourDate = new Date(now.getTime() + 60 * 60 * 1000);
  
  // Round to the next hour (set minutes, seconds, milliseconds to 0)
  nextHourDate.setMinutes(0);
  nextHourDate.setSeconds(0);
  nextHourDate.setMilliseconds(0);
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm in local time)
  const year = nextHourDate.getFullYear();
  const month = String(nextHourDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextHourDate.getDate()).padStart(2, '0');
  const hours = String(nextHourDate.getHours()).padStart(2, '0');
  const minutes = String(nextHourDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate a unique reminder ID
 * @returns {string} Unique reminder ID
 */
function generateReminderId() {
  return `reminder-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validate datetime is in the future
 * @param {string} dateTimeString - Datetime string from input
 * @returns {Object} Validation result with valid flag and error message
 */
function validateFutureDateTime(dateTimeString) {
  if (!dateTimeString) {
    return { valid: false, error: "Please select when you'd like to be reminded" };
  }
  
  const selectedTime = new Date(dateTimeString).getTime();
  const now = Date.now();
  
  if (selectedTime <= now) {
    const diffMinutes = Math.round((now - selectedTime) / (1000 * 60));
    return { 
      valid: false, 
      error: `Please select a date and time in the future. The selected time is ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} in the past.` 
    };
  }
  
  return { valid: true };
}

