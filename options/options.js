// Options page script for managing reminders

let reminders = [];
let filteredReminders = [];
let editingId = null;
let lastDismissedReminder = null;
let undoTimeout = null;
let currentSort = "scheduledTime-asc";
let currentSearch = "";
let searchTimeout = null;

const STATUS_BADGES = {
  active: { text: "Active", className: "badge-active", icon: "⏰", color: "#238636" },
  completed: { text: "Completed", className: "badge-completed", icon: "✓", color: "#a371f7" },
  dismissed: { text: "Dismissed", className: "badge-dismissed", icon: "⊘", color: "#8b949e" },
};

/**
 * Get status badge info
 * @param {string} status - Reminder status
 * @returns {Object} Badge configuration object
 */
function getStatusBadge(status) {
  return STATUS_BADGES[status] || STATUS_BADGES.active;
}

/**
 * Load and display reminders
 */
async function loadReminders() {
  const loadingDiv = document.getElementById("loading");
  const emptyStateDiv = document.getElementById("empty-state");
  const remindersListDiv = document.getElementById("reminders-list");
  const controlsSection = document.getElementById("controls-section");

  try {
    // Reload reminders from storage
    reminders = await getAllReminders();
    
    // Ensure reminders is an array
    if (!Array.isArray(reminders)) {
      reminders = [];
    }
    
    loadingDiv.style.display = "none";

    if (reminders.length === 0) {
      emptyStateDiv.style.display = "block";
      remindersListDiv.style.display = "none";
      if (controlsSection) controlsSection.style.display = "none";
      // Update stats even when empty
      updateStats();
    } else {
      emptyStateDiv.style.display = "none";
      if (controlsSection) controlsSection.style.display = "flex";
      applyFiltersAndSort();
    }
  } catch (error) {
    console.error("Error loading reminders:", error);
    loadingDiv.textContent = "Unable to load reminders. Please refresh the page.";
    loadingDiv.style.color = "#ff7b72";
    // Update stats even on error (will show 0s)
    updateStats();
  }
}

/**
 * Filter reminders based on search query
 * @param {Array} remindersList - Array of reminders to filter
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered reminders
 */
function filterReminders(remindersList, searchQuery) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return remindersList;
  }
  
  const query = searchQuery.toLowerCase().trim();
  const queryWords = query.split(/\s+/).filter(word => word.length > 0);
  
  return remindersList.filter(reminder => {
    const text = reminder.text.toLowerCase();
    const dateStr = formatDateTime(reminder.scheduledTime).toLowerCase();
    const relativeTime = getRelativeTime(reminder.scheduledTime).toLowerCase();
    const status = reminder.status.toLowerCase();
    const createdDate = reminder.createdAt ? formatDateOnly(reminder.createdAt).toLowerCase() : "";
    
    // If multiple words, all words must match somewhere
    if (queryWords.length > 1) {
      return queryWords.every(word => 
        text.includes(word) || 
        dateStr.includes(word) || 
        relativeTime.includes(word) ||
        status.includes(word) ||
        createdDate.includes(word)
      );
    }
    
    // Single word search - match anywhere
    return text.includes(query) || 
           dateStr.includes(query) || 
           relativeTime.includes(query) ||
           status.includes(query) ||
           createdDate.includes(query);
  });
}

/**
 * Sort reminders based on sort option
 * @param {Array} remindersList - Array of reminders to sort
 * @param {string} sortOption - Sort option (e.g., "scheduledTime-asc")
 * @returns {Array} Sorted reminders
 */
function sortReminders(remindersList, sortOption) {
  const [field, direction] = sortOption.split("-");
  const sorted = [...remindersList];
  
  sorted.sort((a, b) => {
    let aValue, bValue;
    
    switch (field) {
      case "scheduledTime":
      case "createdAt":
        aValue = Number(a[field]);
        bValue = Number(b[field]);
        break;
      case "text":
        aValue = a.text.toLowerCase();
        bValue = b.text.toLowerCase();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Apply filters and sort, then render
 */
function applyFiltersAndSort() {
  filteredReminders = filterReminders(reminders, currentSearch);
  filteredReminders = sortReminders(filteredReminders, currentSort);
  
  const remindersListDiv = document.getElementById("reminders-list");
  const noResultsDiv = document.getElementById("no-results");
  const emptyStateDiv = document.getElementById("empty-state");
  const searchResultsCount = document.getElementById("search-results-count");
  const hasSearch = currentSearch.trim().length > 0;
  
  // Update search results count
  if (searchResultsCount) {
    if (hasSearch && filteredReminders.length > 0) {
      searchResultsCount.textContent = `${filteredReminders.length} result${filteredReminders.length !== 1 ? 's' : ''}`;
      searchResultsCount.style.display = "inline-block";
    } else {
      searchResultsCount.style.display = "none";
    }
  }
  
  // Show/hide appropriate sections
  if (filteredReminders.length === 0) {
    remindersListDiv && (remindersListDiv.style.display = "none");
    emptyStateDiv && (emptyStateDiv.style.display = hasSearch ? "none" : "block");
    noResultsDiv && (noResultsDiv.style.display = hasSearch ? "block" : "none");
  } else {
    emptyStateDiv && (emptyStateDiv.style.display = "none");
    noResultsDiv && (noResultsDiv.style.display = "none");
    if (remindersListDiv) {
      remindersListDiv.style.display = "block";
      renderReminders();
    }
  }
  
  updateStats();
}

/**
 * Update statistics display
 */
function updateStats() {
  const counts = {
    active: reminders.filter((r) => r.status === "active").length,
    completed: reminders.filter((r) => r.status === "completed").length,
    dismissed: reminders.filter((r) => r.status === "dismissed").length,
  };

  const activeCountEl = document.getElementById("active-count");
  const completedCountEl = document.getElementById("completed-count");
  const dismissedCountEl = document.getElementById("dismissed-count");
  
  if (activeCountEl) activeCountEl.textContent = counts.active;
  if (completedCountEl) completedCountEl.textContent = counts.completed;
  if (dismissedCountEl) dismissedCountEl.textContent = counts.dismissed;
}

/**
 * Render reminders list
 */
function renderReminders() {
  const remindersListDiv = document.getElementById("reminders-list");
  if (!remindersListDiv) return;
  
  remindersListDiv.innerHTML = "";

  if (filteredReminders.length === 0) {
    return;
  }

  filteredReminders.forEach((reminder, index) => {
    const badge = getStatusBadge(reminder.status);
    const isPast = reminder.scheduledTime < Date.now();
    const isEditing = editingId === reminder.id;

    const reminderDiv = document.createElement("div");
    reminderDiv.className = `reminder-item ${reminder.status} ${isPast ? "past" : ""}`;
    
    // Ensure visibility from the start
    reminderDiv.style.opacity = "1";
    reminderDiv.style.display = "flex";

    if (isEditing) {
      reminderDiv.innerHTML = createEditForm(reminder, index + 1);
    } else {
      reminderDiv.innerHTML = createReminderCard(reminder, badge, isPast, index + 1);
    }

    remindersListDiv.appendChild(reminderDiv);
    
    // Trigger animation by resetting and re-applying
    requestAnimationFrame(() => {
      const infoItems = reminderDiv.querySelectorAll('.info-item');
      infoItems.forEach((item, itemIndex) => {
        item.style.animation = 'none';
        requestAnimationFrame(() => {
          item.style.animation = '';
          item.style.animationDelay = `${(itemIndex + 1) * 0.1}s`;
        });
      });
    });
  });

  attachEventListeners();
}

/**
 * Highlight search terms in text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} HTML string with highlighted matches
 */
function highlightSearch(text, query) {
  if (!query || query.trim().length === 0) {
    return escapeHtml(text);
  }
  
  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(query);
  const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  
  return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Create reminder card HTML
 * @param {Object} reminder - Reminder object
 * @param {Object} badge - Badge configuration
 * @param {boolean} isPast - Whether reminder time has passed
 * @param {number} number - Reminder number for display
 * @returns {string} HTML string
 */
function createReminderCard(reminder, badge, isPast, number) {
  const relativeTime = getRelativeTime(reminder.scheduledTime);
  const isOverdue = isPast && reminder.status === "active";
  const createdDate = reminder.createdAt ? formatDateOnly(reminder.createdAt) : "Unknown";
  
  // Highlight search terms if search is active
  const highlightedText = currentSearch ? highlightSearch(reminder.text, currentSearch) : escapeHtml(reminder.text);
  const highlightedDate = currentSearch ? highlightSearch(formatDateTime(reminder.scheduledTime), currentSearch) : formatDateTime(reminder.scheduledTime);
  const highlightedRelative = currentSearch ? highlightSearch(relativeTime, currentSearch) : relativeTime;
  const highlightedCreated = currentSearch ? highlightSearch(createdDate, currentSearch) : createdDate;
  
  return `
    <div class="reminder-number">#${number}</div>
    <div class="reminder-content">
      <div class="reminder-header-section">
        <div class="reminder-header-top">
          <span class="badge ${badge.className}">
            <span class="badge-icon">${badge.icon}</span>
            ${badge.text}
          </span>
          ${isOverdue ? '<span class="badge badge-overdue">⚠ Overdue</span>' : ""}
        </div>
        <p class="reminder-text">${highlightedText}</p>
      </div>
      
      <div class="reminder-info-section">
        <div class="info-item">
          <span class="info-icon">📅</span>
          <div class="info-content">
            <span class="info-label">Scheduled For</span>
            <span class="info-value">${highlightedDate}</span>
          </div>
        </div>
        
        <div class="info-item">
          <span class="info-icon">⏱️</span>
          <div class="info-content">
            <span class="info-label">Time Remaining</span>
            <span class="info-value">${highlightedRelative}</span>
          </div>
        </div>
        
        <div class="info-item">
          <span class="info-icon">📝</span>
          <div class="info-content">
            <span class="info-label">Created On</span>
            <span class="info-value">${highlightedCreated}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="reminder-actions">
      ${reminder.status === "active" ? `
        <button class="btn-edit" data-id="${reminder.id}" title="Edit this reminder">
          <span class="btn-icon">✏️</span>
          Edit
        </button>
        <button class="btn-dismiss" data-id="${reminder.id}" title="Dismiss this reminder">
          <span class="btn-icon">⊘</span>
          Dismiss
        </button>
      ` : ""}
      <button class="btn-delete" data-id="${reminder.id}" data-time="${reminder.scheduledTime}" title="Delete this reminder">
        <span class="btn-icon">🗑️</span>
        Delete
      </button>
    </div>
  `;
}

/**
 * Create edit form HTML
 * @param {Object} reminder - Reminder object
 * @param {number} number - Reminder number for display
 * @returns {string} HTML string
 */
function createEditForm(reminder, number) {
  const dateTimeValue = formatDateTimeLocal(reminder.scheduledTime);
  const minDateTime = formatDateTimeLocal(Date.now() + 60000); // Now + 1 minute
  
  return `
    <div class="reminder-number">#${number}</div>
    <div class="edit-form">
      <textarea class="edit-text-input" data-id="${reminder.id}" rows="3" placeholder="What would you like to be reminded about?">${escapeHtml(reminder.text)}</textarea>
      <div class="datetime-group">
        <input type="datetime-local" class="edit-datetime-input" data-id="${reminder.id}" value="${dateTimeValue}" min="${minDateTime}" />
        <button type="button" class="today-button edit-today-button" data-id="${reminder.id}" title="Set to the next hour (current date, next hour at :00)">
          Set to Next Hour
        </button>
      </div>
      <div class="edit-actions">
        <button class="btn-save" data-id="${reminder.id}">
          <span class="btn-icon">✓</span>
          Save Changes
        </button>
        <button class="btn-cancel" data-id="${reminder.id}">
          <span class="btn-icon">✕</span>
          Cancel
        </button>
      </div>
    </div>
  `;
}

/**
 * Format datetime for datetime-local input (local time)
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Local datetime string (YYYY-MM-DDTHH:mm)
 */
function formatDateTimeLocal(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Attach event listeners to reminder cards
 */
function attachEventListeners() {
  // Edit buttons
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      startEdit(id);
    });
  });

  // Dismiss buttons
  document.querySelectorAll(".btn-dismiss").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      await handleDismiss(id);
    });
  });

  // Delete buttons
  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const scheduledTime = parseInt(e.currentTarget.getAttribute("data-time"));
      await handleDelete(id, scheduledTime);
    });
  });

  // Save buttons (edit forms)
  document.querySelectorAll(".btn-save").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      await saveEdit(id);
    });
  });

  // Cancel buttons (edit forms)
  document.querySelectorAll(".btn-cancel").forEach((btn) => {
    btn.addEventListener("click", () => {
      cancelEdit();
    });
  });

  // Set to Next Hour buttons (edit forms)
  document.querySelectorAll(".edit-today-button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const datetimeInput = document.querySelector(`.edit-datetime-input[data-id="${id}"]`);
      if (datetimeInput) {
        datetimeInput.value = getNextHourDateTime();
      }
    });
  });
}

/**
 * Start editing a reminder
 * @param {string} id - Reminder ID
 */
function startEdit(id) {
  editingId = id;
  renderReminders();
  // Focus text input after render
  requestAnimationFrame(() => {
    const textInput = document.querySelector(`.edit-text-input[data-id="${id}"]`);
    textInput?.focus();
  });
}

/**
 * Cancel editing
 */
function cancelEdit() {
  editingId = null;
  renderReminders();
}

/**
 * Save edited reminder
 * @param {string} id - Reminder ID
 */
async function saveEdit(id) {
  const textInput = document.querySelector(`.edit-text-input[data-id="${id}"]`);
  const datetimeInput = document.querySelector(`.edit-datetime-input[data-id="${id}"]`);

  if (!textInput || !datetimeInput) {
    showNotification("Unable to find reminder fields", "error");
    return;
  }

  const text = textInput.value.trim();
  const dateTime = datetimeInput.value;

  if (!text) {
    showNotification("Please enter what you'd like to be reminded about", "error");
    return;
  }

  const validation = validateFutureDateTime(dateTime);
  if (!validation.valid) {
    showNotification(validation.error, "error");
    return;
  }

  const selectedTime = new Date(dateTime).getTime();
  const reminder = reminders.find((r) => r.id === id);
  
  if (!reminder) {
    showNotification("Reminder not found", "error");
    return;
  }

  try {
    // Cancel existing alarm
    await cancelReminderById(reminder.id, reminder.scheduledTime);

    // Update reminder
    reminder.text = text;
    reminder.scheduledTime = Number(selectedTime);
    reminder.alarmName = `reminder-${reminder.id}-${reminder.scheduledTime}`;

    await saveReminder(reminder);
    await scheduleReminder(reminder);

    editingId = null;
    showNotification("Reminder updated successfully!", "success");
    await loadReminders();
  } catch (error) {
    console.error("Error updating reminder:", error);
    showNotification(error.message || "Unable to update reminder. Please try again.", "error");
  }
}

/**
 * Handle dismiss with undo
 * @param {string} id - Reminder ID
 */
async function handleDismiss(id) {
  const reminder = reminders.find((r) => r.id === id);
  if (!reminder) {
    showNotification("Reminder not found", "error");
    return;
  }

  try {
    // Store reminder for undo
    lastDismissedReminder = { ...reminder };
    
    // Clear existing undo timeout
    if (undoTimeout) {
      clearTimeout(undoTimeout);
    }
    
    await cancelReminderById(reminder.id, reminder.scheduledTime);
    await updateReminderStatus(id, "dismissed");
    
    // Show notification with undo button
    showNotificationWithUndo("Reminder dismissed", handleUndoDismiss);
    
    await loadReminders();
    
    // Clear undo option after 5 seconds
    undoTimeout = setTimeout(() => {
      lastDismissedReminder = null;
    }, 5000);
  } catch (error) {
    console.error("Error dismissing reminder:", error);
    showNotification("Unable to dismiss reminder", "error");
  }
}

/**
 * Handle undo dismiss
 */
async function handleUndoDismiss() {
  if (!lastDismissedReminder) return;
  
  try {
    const reminder = lastDismissedReminder;
    
    // Restore reminder to active status
    await updateReminderStatus(reminder.id, "active");
    
    // Reschedule alarm if it's in the future
    if (reminder.scheduledTime > Date.now()) {
      reminder.alarmName = `reminder-${reminder.id}-${reminder.scheduledTime}`;
      await scheduleReminder(reminder);
    }
    
    lastDismissedReminder = null;
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      undoTimeout = null;
    }
    
    showNotification("Reminder restored", "success");
    await loadReminders();
  } catch (error) {
    console.error("Error undoing dismiss:", error);
    showNotification("Unable to restore reminder", "error");
  }
}

/**
 * Handle delete
 * @param {string} id - Reminder ID
 * @param {number} scheduledTime - Scheduled time timestamp
 */
async function handleDelete(id, scheduledTime) {
  if (!confirm("Are you sure you want to delete this reminder? This action cannot be undone.")) {
    return;
  }

  try {
    await cancelReminderById(id, scheduledTime);
    await deleteReminder(id);
    showNotification("Reminder deleted", "success");
    await loadReminders();
  } catch (error) {
    console.error("Error deleting reminder:", error);
    showNotification(error.message || "Unable to delete reminder. Please try again.", "error");
  }
}

/**
 * Handle add new reminder form submission
 * @param {Event} e - Form submit event
 */
async function handleAddReminder(e) {
  e.preventDefault();
  
  const textInput = document.getElementById("new-reminder-text");
  const datetimeInput = document.getElementById("new-reminder-datetime");
  const addForm = document.getElementById("add-reminder-form");
  
  if (!textInput || !datetimeInput || !addForm) {
    showNotification("Form elements not found", "error");
    return;
  }
  
  const text = textInput.value.trim();
  const dateTime = datetimeInput.value;
  
  if (!text) {
    showNotification("Please enter what you'd like to be reminded about", "error");
    textInput.focus();
    return;
  }

  const validation = validateFutureDateTime(dateTime);
  if (!validation.valid) {
    showNotification(validation.error, "error");
    datetimeInput.focus();
    return;
  }
  
  const selectedTime = new Date(dateTime).getTime();
  
  try {
    const reminderId = generateReminderId();
    const reminder = {
      id: reminderId,
      text: text,
      scheduledTime: Number(selectedTime),
      createdAt: Date.now(),
      status: "active",
      alarmName: `reminder-${reminderId}-${Number(selectedTime)}`,
    };
    
    await saveReminder(reminder);
    await scheduleReminder(reminder);
    
    // Reset form
    textInput.value = "";
    datetimeInput.value = "";
    datetimeInput.min = getMinDateTime();
    
    // Hide form
    addForm.style.display = "none";
    
    showNotification("Reminder created successfully!", "success");
    await loadReminders();
  } catch (error) {
    console.error("Error creating reminder:", error);
    showNotification(error.message || "Unable to create reminder. Please try again.", "error");
  }
}

/**
 * Toggle add reminder form visibility
 */
function toggleAddForm() {
  const form = document.getElementById("add-reminder-form");
  const isVisible = form.style.display !== "none";
  
  if (isVisible) {
    form.style.display = "none";
  } else {
    form.style.display = "block";
    const datetimeInput = document.getElementById("new-reminder-datetime");
    datetimeInput.min = getMinDateTime();
    document.getElementById("new-reminder-text").focus();
  }
}

/**
 * Show notification message
 * @param {string} message - Notification message
 * @param {string} type - Notification type ("success" or "error")
 */
function showNotification(message, type) {
  let notification = document.getElementById("notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.id = "notification";
    notification.className = "notification";
    document.body.appendChild(notification);
  }
  
  notification.innerHTML = `<span class="notification-message">${message}</span>`;
  notification.className = `notification notification-${type}`;
  notification.style.display = "block";
  
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.style.display = "none";
      notification.style.opacity = "1";
    }, 300);
  }, 3000);
}

/**
 * Show notification with undo button
 * @param {string} message - Notification message
 * @param {Function} undoCallback - Callback function for undo action
 */
function showNotificationWithUndo(message, undoCallback) {
  let notification = document.getElementById("notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.id = "notification";
    notification.className = "notification";
    document.body.appendChild(notification);
  }
  
  const undoButton = document.createElement("button");
  undoButton.className = "undo-button";
  undoButton.textContent = "Undo";
  undoButton.onclick = () => {
    undoCallback();
    notification.style.display = "none";
  };
  
  notification.innerHTML = `<span class="notification-message">${message}</span>`;
  notification.appendChild(undoButton);
  notification.className = `notification notification-success notification-with-undo`;
  notification.style.display = "flex";
  
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.style.display = "none";
      notification.style.opacity = "1";
    }, 300);
  }, 5000);
}

/**
 * Initialize options page
 */
document.addEventListener("DOMContentLoaded", () => {
  loadReminders();
  
  // Listen for storage changes to refresh reminders when they're added/updated/deleted from popup
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.reminders) {
      // Reload reminders when storage changes
      loadReminders();
    }
  });
  
  // Add reminder form handlers
  const toggleButton = document.getElementById("toggle-add-form");
  const addForm = document.getElementById("add-reminder-form");
  const cancelButton = document.getElementById("cancel-add-form");
  const nextHourButton = document.getElementById("today-button-dashboard");
  
  toggleButton.addEventListener("click", toggleAddForm);
  addForm.addEventListener("submit", handleAddReminder);
  cancelButton.addEventListener("click", () => {
    addForm.style.display = "none";
    document.getElementById("new-reminder-text").value = "";
    document.getElementById("new-reminder-datetime").value = "";
  });
  
  // Handle "Set to Next Hour" button in add form
  nextHourButton.addEventListener("click", () => {
    const datetimeInput = document.getElementById("new-reminder-datetime");
    datetimeInput.value = getNextHourDateTime();
  });
  
  // Search functionality
  const searchInput = document.getElementById("search-input");
  const clearSearchButton = document.getElementById("clear-search");
  
  if (searchInput) {
    // Debounce search to avoid too many re-renders
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value;
      
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Update clear button visibility immediately
      if (clearSearchButton) {
        clearSearchButton.style.display = value.trim() ? "block" : "none";
      }
      
      // Debounce the actual search
      searchTimeout = setTimeout(() => {
        currentSearch = value;
        applyFiltersAndSort();
      }, 150);
    });
    
    // Handle keyboard shortcuts
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        currentSearch = e.target.value;
        applyFiltersAndSort();
      } else if (e.key === "Escape") {
        e.target.value = "";
        currentSearch = "";
        if (clearSearchButton) {
          clearSearchButton.style.display = "none";
        }
        applyFiltersAndSort();
      }
    });
  }
  
  if (clearSearchButton) {
    clearSearchButton.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      currentSearch = "";
      clearSearchButton.style.display = "none";
      applyFiltersAndSort();
    });
  }
  
  // Sort functionality
  const sortSelect = document.getElementById("sort-select");
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
  });
});
