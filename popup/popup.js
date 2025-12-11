// Popup script for creating reminders

/**
 * Show message to user
 * @param {HTMLElement} element - Message element
 * @param {string} text - Message text
 * @param {string} type - Message type ("success" or "error")
 */
function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message message-${type}`;
  element.style.display = "block";
  element.style.animation = "fadeIn 0.3s ease-in";
}

/**
 * Hide message with fade out animation
 * @param {HTMLElement} element - Message element
 */
function hideMessage(element) {
  element.style.animation = "fadeOut 0.3s ease-out";
  setTimeout(() => {
    element.style.display = "none";
  }, 300);
}

/**
 * Validate form input
 * @param {string} text - Reminder text
 * @param {string} dateTime - Datetime string
 * @returns {Object} Validation result with valid flag and error message
 */
function validateForm(text, dateTime) {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Please enter what you'd like to be reminded about" };
  }
  
  return validateFutureDateTime(dateTime);
}

/**
 * Create reminder object
 * @param {string} text - Reminder text
 * @param {number} scheduledTime - Scheduled time timestamp
 * @returns {Object} Reminder object
 */
function createReminderObject(text, scheduledTime) {
  const id = generateReminderId();
  const scheduled = Number(scheduledTime);
  return {
    id,
    text: text.trim(),
    scheduledTime: scheduled,
    createdAt: Date.now(),
    status: "active",
    alarmName: `reminder-${id}-${scheduled}`,
  };
}

/**
 * Initialize popup
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reminder-form");
  const textInput = document.getElementById("reminder-text");
  const datetimeInput = document.getElementById("reminder-datetime");
  const messageDiv = document.getElementById("message");
  const submitButton = document.getElementById("submit-button");
  const manageButton = document.getElementById("manage-button");
  const nextHourButton = document.getElementById("today-button");

  // Set minimum datetime
  datetimeInput.min = getMinDateTime();

  // Handle "Set to Next Hour" button click
  nextHourButton.addEventListener("click", () => {
    datetimeInput.value = getNextHourDateTime();
    datetimeInput.dispatchEvent(new Event("change"));
  });

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const text = textInput.value.trim();
    const dateTime = datetimeInput.value;

    // Validate input
    const validation = validateForm(text, dateTime);
    if (!validation.valid) {
      showMessage(messageDiv, validation.error, "error");
      return;
    }

    const selectedTime = new Date(dateTime).getTime();
    
    // Set loading state
    submitButton.disabled = true;
    const buttonIcon = submitButton.querySelector(".button-icon");
    const buttonText = submitButton.querySelector(".button-text");
    
    if (buttonText) {
      buttonText.textContent = "Creating...";
    } else {
      submitButton.innerHTML = '<span class="button-icon">⏳</span><span class="button-text">Creating...</span>';
    }
    
    hideMessage(messageDiv);

    try {
      const reminder = createReminderObject(text, selectedTime);

      // Save reminder and schedule alarm
      await saveReminder(reminder);
      await scheduleReminder(reminder);

      // Success feedback
      showMessage(messageDiv, "✓ Reminder created successfully!", "success");
      textInput.value = "";
      datetimeInput.value = "";
      datetimeInput.min = getMinDateTime();

      // Clear message after 3 seconds
      setTimeout(() => {
        hideMessage(messageDiv);
      }, 3000);
    } catch (error) {
      console.error("Error creating reminder:", error);
      showMessage(messageDiv, error.message || "Unable to create reminder. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
      if (buttonText) {
        buttonText.textContent = "Create Reminder";
      } else {
        submitButton.innerHTML = '<span class="button-icon">✓</span><span class="button-text">Create Reminder</span>';
      }
    }
  });

  // Handle manage button click
  manageButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});
