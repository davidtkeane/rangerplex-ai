// ----- scripts/app.js (Frontend Logic Only - CORRECTED) -----

// ========== DOM ELEMENTS ==========
// Get references to HTML elements by their ID.
const searchBtn = document.getElementById('searchBtn');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const saveAllBtn = document.getElementById('saveAllBtn');
const newNoteBtn = document.getElementById('newNoteBtn');
const noteCount = document.getElementById('noteCount');
const sortSelect = document.getElementById('sortSelect');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');
const colorFilterBtns = document.querySelectorAll('.color-filter-btn');
const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
// --- Course Bar Elements ---
const courseBarContainer = document.getElementById('courseBarContainer'); // Good to have reference
const dynamicCourses = document.getElementById('dynamicCourses');         // Good to have reference
const addCourseBtn = document.getElementById('addCourseBtn');             // <<< Make sure this line exists
const allNotesCourse = document.getElementById('course-all');             // <<< Make sure this line exists
const emptyStateNewNoteBtn = document.getElementById('emptyStateNewNoteBtn');
const editorModal = document.getElementById('editorModal');
const editorTitle = document.getElementById('editorTitle');
const closeEditorBtn = document.getElementById('closeEditorBtn');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const noteColorRadios = document.querySelectorAll('input[name="noteColor"]');
const noteDueDate = document.getElementById('noteDueDate');
const clearDueDateBtn = document.getElementById('clearDueDateBtn');
const notePriorityRadios = document.querySelectorAll('input[name="notePriority"]');
const noteReminder = document.getElementById('noteReminder');
const clearReminderBtn = document.getElementById('clearReminderBtn');
const notePinned = document.getElementById('notePinned');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const noteViewModal = document.getElementById('noteViewModal');
const viewNoteTitle = document.getElementById('viewNoteTitle');
const viewNoteDate = document.getElementById('viewNoteDate');
const viewNoteTime = document.getElementById('viewNoteTime');
const viewNoteContent = document.getElementById('viewNoteContent');
const viewNoteReminder = document.getElementById('viewNoteReminder');
const reminderText = document.getElementById('reminderText');
const editNoteBtn = document.getElementById('editNoteBtn');
const closeViewBtn = document.getElementById('closeViewBtn');
// --- NEW: Get references to the split Backup/Restore buttons in the footer ---
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const importExportModal = document.getElementById('importExportModal');
const closeImportExportBtn = document.getElementById('closeImportExportBtn');
const exportNotesBtn = document.getElementById('exportNotesBtn');
const importFileInput = document.getElementById('importFileInput');
const importNotesBtn = document.getElementById('importNotesBtn');
const browseBtn = document.getElementById('browseBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
// --- NEW: Todo List Elements ---
const todoSection = document.getElementById('todoSection');
const toggleTodoBtn = document.getElementById('toggleTodoBtn');
const todoContainer = document.getElementById('todoContainer');
const todoList = document.getElementById('todoList');
const newTodoInput = document.getElementById('newTodoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
// --- Course Modal Elements ---
const courseModal = document.getElementById('courseModal');
const courseName = document.getElementById('courseName');
const courseSemester = document.getElementById('courseSemester');
const courseInstructor = document.getElementById('courseInstructor');

// ========== STATE VARIABLES ==========
const placeholderText = '<p>Start writing your note here...</p>';
const placeholderColor = 'text-gray-400';

// ========== UNDO SYSTEM ==========
let undoHistory = [];
const MAX_UNDO_HISTORY = 10; // Keep last 10 actions
const editorTextColor = 'text-gray-800'; // Adjust if needed for dark mode via CSS

let appState = {
  // currentCourse: null, // We can remove this if unused, or rename it
  currentSelectedCourseId: 'all', // <<< ADD THIS LINE, default to 'all'
  courses: [],
  notes: []
}; // Holds the current app state including courses and notes
let currentNoteId = null;
let currentFilterColor = 'all';
let dragSrcEl = null;
let confirmationTimeout = null; // For the save confirmation message

// ========== CONFIGURATION ==========
const API_BASE_URL = 'http://localhost:3002/api'; // Base URL for the backend API (moved from 3001)

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadThemePreference();
    fetchNotesAndFinalize(); // Renamed initial fetch function call
    
    // --- Course Modal Event Listeners ---
    const closeCourseBtn = document.getElementById('closeCourseBtn');
    const cancelCourseBtn = document.getElementById('cancelCourseBtn');
    const saveCourseBtn = document.getElementById('saveCourseBtn');
    
    console.log('Setting up course modal event listeners...');
    console.log('closeCourseBtn:', closeCourseBtn);
    console.log('cancelCourseBtn:', cancelCourseBtn);
    
    if (closeCourseBtn) {
        closeCourseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Close button clicked');
            closeCourseModal();
        });
    }
    if (cancelCourseBtn) {
        cancelCourseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Cancel button clicked');
            closeCourseModal();
        });
    }
    if (saveCourseBtn) {
        saveCourseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Save button clicked');
            saveCourse();
        });
    }
    
    // --- Global Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // ESC key for closing course modal
        if (e.key === 'Escape') {
            const courseModal = document.getElementById('courseModal');
            if (courseModal && !courseModal.classList.contains('hidden')) {
                console.log('ESC pressed, closing course modal');
                closeCourseModal();
            }
        }
        
        // Ctrl+Z for undo (Cmd+Z on Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            console.log('Undo keyboard shortcut triggered');
            performUndo();
        }
    });
    
    // --- Static Work Course Button ---
    const workCourseBtn = document.getElementById('course-work');
    if (workCourseBtn) {
        workCourseBtn.addEventListener('click', () => {
            handleStaticCourseClick('work');
        });
        
        // Add drag and drop support for Work button
        addDropSupportToStaticCourse(workCourseBtn, 'work');
    }
    
    // --- All Notes Button Drop Support ---
    const allNotesBtn = document.getElementById('course-all');
    if (allNotesBtn) {
        addDropSupportToStaticCourse(allNotesBtn, 'all');
    }
    
    // --- Undo Button Event Listener ---
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', performUndo);
    }
});

// --- NEW: Renamed initial fetch logic into its own function ---
function fetchNotesAndFinalize() {
    console.log("Attempting to load notes from backend...");
    fetch(`${API_BASE_URL}/notes`)
        .then(response => {
            // ... (Keep existing fetch logic for GET /api/notes) ...
            if (!response.ok) { throw new Error(/*...*/); }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) { return response.json(); }
            else { throw new Error("Received non-JSON response"); }
        })
        .then(data => {
            console.log('Raw data from backend:', data);
            // ... (Keep existing logic to process fetched data) ...
            // Handle new {courses, notes} structure from backend (backwards compatible)
            if (data.courses && data.notes) {
                console.log('Processing new courses format');
                appState.courses = data.courses;
                appState.notes = data.notes;
                appState.currentSelectedCourseId = data.currentSelectedCourseId || 'all';
            } else if (data.tabs && data.notes) {
                // Backwards compatibility: convert tabs to courses
                console.log('Converting tabs to courses format');
                appState.courses = data.tabs.map(tab => ({
                    ...tab,
                    color: tab.color || '#3b82f6',
                    semester: tab.semester || 'Current',
                    instructor: tab.instructor || ''
                }));
                appState.notes = data.notes;
                appState.currentSelectedCourseId = data.currentSelectedTabId || 'all';
                console.log('Converted courses:', appState.courses);
                console.log('Notes loaded:', appState.notes.length);
            } else if (Array.isArray(data)) { // Fallback for old array format
                console.warn('Received legacy notes array format from backend');
                appState.notes = data;
                appState.courses = [];
                appState.currentSelectedCourseId = 'all';
            } else {
                console.warn('Invalid data format - initializing empty state');
                appState = { courses: [], notes: [], currentSelectedCourseId: 'all' };
            }
            console.log(`Loaded ${appState.notes.length} notes and ${appState.courses.length} courses from backend`);
        })
        .catch(error => {
            // ... (Keep existing error handling) ...
            console.error('Error fetching notes:', error);
            if (error.message.includes('Failed to fetch')) { alert(/*...*/); }
            notes = [];
        })
        .finally(() => {
            finalizeInitialization(); // Render notes etc.
            // --- ADDED: Connect to SSE after initial load ---
            connectToSseEvents(); // <<< Start listening for server events
        });
}
// Helper function to finalize initialization
function finalizeInitialization() {
    renderNotes();
    renderCourses(); // <<< ADD THIS LINE
    updateNoteCount();
    checkEmptyState();
    checkReminders(); // Client-side reminder check
    setDefaultReminderTime(); // Set default in editor
    requestNotificationPermission(); // Ask for permission
    console.log("Initialization complete. Courses:", appState.courses.length, "Notes:", appState.notes.length);
}

// Helper to set default reminder time
function setDefaultReminderTime() {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    if (noteReminder) {
      noteReminder.value = formatDateTimeLocal(now);
    }
}

// Helper to request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

// --- NEW: Auto-refresh notification function ---
/**
 * Shows a stylish auto-closing notification that refreshes the page after 3 seconds
 */
function showAutoRefreshNotification() {
    // Create notification overlay
    const notification = document.createElement('div');
    notification.id = 'auto-refresh-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        ">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 1.2em;">📝</span>
                <strong>Sticky Note Added!</strong>
            </div>
            <div style="font-size: 0.9em; margin-bottom: 15px;">
                Page will refresh in <span id="countdown">3</span> seconds to sync your notes...
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="refreshNow()" style="
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.8em;
                ">Refresh Now</button>
                <button onclick="cancelRefresh()" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.8em;
                ">Cancel</button>
            </div>
        </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { 
                opacity: 0; 
                transform: translateX(100%); 
            }
            to { 
                opacity: 1; 
                transform: translateX(0); 
            }
        }
        @keyframes slideOut {
            from { 
                opacity: 1; 
                transform: translateX(0); 
            }
            to { 
                opacity: 0; 
                transform: translateX(100%); 
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Start countdown
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            refreshNow();
        }
    }, 1000);
    
    // Store interval for potential cancellation
    window.autoRefreshInterval = countdownInterval;
    
    // Global functions for buttons
    window.refreshNow = function() {
        clearInterval(window.autoRefreshInterval);
        removeNotification();
        location.reload();
    };
    
    window.cancelRefresh = function() {
        clearInterval(window.autoRefreshInterval);
        removeNotification();
        console.log('Auto-refresh cancelled by user');
    };
    
    function removeNotification() {
        const notif = document.getElementById('auto-refresh-notification');
        if (notif) {
            notif.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notif.parentNode) {
                    notif.parentNode.removeChild(notif);
                }
            }, 300);
        }
    }
}

// --- NEW: Function to connect to SSE endpoint ---
/**
 * Establishes a connection to the backend's Server-Sent Events endpoint
 * and listens for update messages.
 */
function connectToSseEvents() {
    console.log('Attempting to connect to SSE endpoint...');

    // Check if EventSource is supported by the browser
    if (typeof(EventSource) === "undefined") {
      console.warn("SSE not supported by this browser.");
      // Optionally display a message to the user that real-time updates won't work
      // showSaveConfirmation("Real-time updates not supported by browser.", true);
      return; // Stop if not supported
    }

    // Create a new EventSource connection to the backend endpoint
    // Note: API_BASE_URL already includes '/api', so we just add '/events'
    const eventSource = new EventSource(`${API_BASE_URL}/events`);

    // --- Handle successful connection ---
    eventSource.onopen = function() {
      console.log('SSE Connection opened successfully.'); // Did you see this in the BROWSER console?
    };

    // --- Handle incoming messages (default 'message' event or custom ones) ---
    // Listen for the specific 'notes_updated' event we defined in the backend
    eventSource.addEventListener('notes_updated', function(event) {
        console.log('SSE message received (notes_updated event):', event.data); // Check if THIS log appears

        // Optional: Add a small delay or check if user is interacting
        // to avoid interrupting them constantly if updates are frequent.

        // Show auto-closing notification that refreshes after 3 seconds
        showAutoRefreshNotification();
    });

    // --- Handle specific 'connected' event (optional) ---
    eventSource.addEventListener('connected', function(event) {
    try {
        const data = JSON.parse(event.data);
        console.log('SSE connected event received. Client ID:', data.clientId);
    } catch(e) {
            console.warn('Received non-JSON connected event data:', event.data);
    }
    });

    // Default 'message' event listener (add this for debugging)
    eventSource.onmessage = function(event) {
         console.log('SSE message received (default message event):', event.data); // ADD THIS LINE
    };

    // Optional: listener for 'connected' event
    eventSource.addEventListener('connected', function(event) { /* ... */ });
    
    // --- Handle errors with the SSE connection ---
    eventSource.onerror = function(err) {
      console.error('SSE Error occurred:', err);
      // Handle different error states
      if (eventSource.readyState == EventSource.CLOSED) {
        console.log('SSE connection was closed.');
        // Optionally try to reconnect after a delay?
      } else if (eventSource.readyState == EventSource.CONNECTING) {
          console.log('SSE attempting to reconnect...');
      } else {
           console.log('SSE connection is still open despite error (or unknown state).');
      }
      // Close the connection on error to prevent constant retries if server is down
      // eventSource.close(); // Uncomment this if you don't want auto-reconnect attempts
    };
}

// ========== EVENT LISTENERS ==========
// --- Editor Note Content Placeholder Logic ---
if (noteContent) {
    noteContent.addEventListener('focus', () => {
        if (noteContent.innerHTML.trim() === placeholderText) {
            noteContent.innerHTML = '<p></p>';
            noteContent.classList.remove(placeholderColor);
            noteContent.classList.add(editorTextColor);
        }
    });
    noteContent.addEventListener('blur', () => {
         const contentTrimmed = noteContent.innerHTML.trim();
        if (contentTrimmed === '' || contentTrimmed === '<p></p>' || contentTrimmed === '<p><br></p>') {
            noteContent.innerHTML = placeholderText;
            noteContent.classList.add(placeholderColor);
            noteContent.classList.remove(editorTextColor);
        }
    });
}
// --- Header Buttons ---
if (searchBtn) searchBtn.addEventListener('click', () => {
    searchBar.classList.toggle('hidden');
    if (!searchBar.classList.contains('hidden')) searchInput.focus();
});
if (searchInput) searchInput.addEventListener('input', renderNotes);
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
if (newNoteBtn) newNoteBtn.addEventListener('click', openNewNoteEditor);
if (saveAllBtn) saveAllBtn.addEventListener('click', () => {
    console.log("Header Save button clicked. Offering 'active.json'.");
    exportNotes('active.json', true);
});
// --- Empty State Button ---
if (emptyStateNewNoteBtn) emptyStateNewNoteBtn.addEventListener('click', openNewNoteEditor);
// --- Editor Modal ---
if (closeEditorBtn) closeEditorBtn.addEventListener('click', closeEditor);
if (saveNoteBtn) saveNoteBtn.addEventListener('click', saveNote);
if (deleteNoteBtn) deleteNoteBtn.addEventListener('click', deleteNote); // Points to the function that now calls deleteNoteById
if (clearDueDateBtn) clearDueDateBtn.addEventListener('click', () => { noteDueDate.value = ''; });
if (clearReminderBtn) clearReminderBtn.addEventListener('click', () => { noteReminder.value = ''; });
// --- Todo List Event Listeners ---
if (toggleTodoBtn) toggleTodoBtn.addEventListener('click', toggleTodoMode);
if (addTodoBtn) addTodoBtn.addEventListener('click', addTodoItem);
if (newTodoInput) newTodoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodoItem();
});
// Course Modal Event Listeners moved to DOMContentLoaded
// --- Note View Modal ---
if (closeViewBtn) closeViewBtn.addEventListener('click', () => {
    noteViewModal.classList.add('hidden');
    document.body.style.overflow = '';
});
if (editNoteBtn) editNoteBtn.addEventListener('click', () => {
    noteViewModal.classList.add('hidden');
    openNoteEditor(currentNoteId);
});
// --- Main Content Controls ---
if (sortSelect) sortSelect.addEventListener('change', renderNotes);
if (filterBtn) filterBtn.addEventListener('click', () => { filterDropdown.classList.toggle('hidden'); });
colorFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilterColor = btn.dataset.color;
        renderNotes();
        filterDropdown.classList.add('hidden');
    });
});

// --- NEW: Add listener for the static "All Notes" tab ---

if (allNotesCourse) {
    allNotesCourse.addEventListener('click', handleCourseClick);
}

// --- Listener for Add New Course Button ---
if (addCourseBtn) {
    addCourseBtn.addEventListener('click', handleAddNewCourse);
}

/**
 * Handles the click event for the "Add New Course" button.
 * Opens the course creation modal.
 */
function handleAddNewCourse() {
    // Open course modal (we'll implement this)
    openCourseModal();
}

/**
 * Handles the click event for the "Add New Tab" button.
 * Prompts user for a name, calls the backend to create the tab,
 * updates local state and UI on success.
 */
async function handleAddNewTab() {
    // 1. Prompt user for the new tab name
    const newTabName = prompt("Enter the name for the new tab:");

    // 2. Validate the input
    if (!newTabName || newTabName.trim().length === 0) {
        // User cancelled or entered empty name
        console.log("Add tab cancelled or name empty.");
        return; // Exit the function
    }

    const trimmedName = newTabName.trim();

    // 3. Call the backend API endpoint
    console.log(`Attempting to create tab with name: "${trimmedName}"`);
    try {
        const response = await fetch(`${API_BASE_URL}/tabs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: trimmedName }) // Send name in request body
        });

        const createdTab = await response.json(); // Try to parse response body

        // 4. Handle the response
        if (!response.ok) {
            // Handle specific errors (like 409 Conflict) or generic errors
            let errorMessage = `Error creating tab: ${response.status}`;
            if (createdTab.message) { // Use message from backend if available
                errorMessage += ` - ${createdTab.message}`;
            }
            throw new Error(errorMessage); // Throw an error to be caught below
        }

        // --- Success ---
        console.log('Tab created successfully by backend:', createdTab);

        // 5. Update local state (add the new tab returned from backend)
        appState.tabs.push(createdTab);

        // 6. Re-render the tab bar to show the new tab
        renderTabs();

        // Optional: Show a success confirmation
        showSaveConfirmation(`Tab "${createdTab.name}" created.`);

    } catch (error) {
        // --- Failure ---
        console.error("Failed to create new tab:", error);
        // Show alert to the user
        alert(`Could not create tab: ${error.message}`);
    }
}

// --- Import/Export Modal ---
// --- NEW: Listeners for the split Backup/Restore buttons in the footer ---
// Listener for the Backup Button
if (backupBtn) backupBtn.addEventListener('click', () => {
    console.log('Backup button clicked - opening modal'); // Added console log for feedback
    importExportModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Later, this button might trigger export directly, but for now, it opens the modal.
});

// Listener for the Restore Button
if (restoreBtn) restoreBtn.addEventListener('click', () => {
    console.log('Restore button clicked - opening modal'); // Added console log for feedback
    importExportModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // This button will continue to open the modal for import options.
});

if (closeImportExportBtn) closeImportExportBtn.addEventListener('click', () => {
    importExportModal.classList.add('hidden');
    document.body.style.overflow = '';
});
if (exportNotesBtn) exportNotesBtn.addEventListener('click', () => {
    console.log("Export modal button clicked. Offering timestamped backup.");
    exportNotes(null, true);
});
if (importFileInput) importFileInput.addEventListener('change', (e) => {
    importNotesBtn.disabled = !(e.target.files.length > 0);
    importNotesBtn.classList.toggle('opacity-50', !(e.target.files.length > 0));
    importNotesBtn.classList.toggle('cursor-not-allowed', !(e.target.files.length > 0));
});
if (importNotesBtn) importNotesBtn.addEventListener('click', () => {
    if (importFileInput.files.length > 0) importNotes(importFileInput.files[0]);
});


// --- Footer Buttons ---
if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all notes? This cannot be undone.')) {
        // Keep a copy in case backend fails
        const initialNotes = [...appState.notes];
        // Optimistic UI update
        appState.notes = [];
        renderNotes(); updateNoteCount(); checkEmptyState();
        saveNotesToBackend()
            .then(() => { console.log("Cleared all notes on backend."); })
            .catch(error => {
                console.error("Failed to clear notes on backend:", error);
                alert("Error: Could not clear notes on the server. Restoring notes.");
                // Revert UI
                appState.notes = initialNotes;
                renderNotes(); updateNoteCount(); checkEmptyState();
            });
    }
});
// --- Global Listeners ---
window.addEventListener('click', (e) => {
    if (e.target === editorModal) closeEditor();
    if (e.target === noteViewModal) { noteViewModal.classList.add('hidden'); document.body.style.overflow = ''; }
    if (e.target === importExportModal) { importExportModal.classList.add('hidden'); document.body.style.overflow = ''; }
    if (filterDropdown && filterBtn && !filterDropdown.contains(e.target) && e.target !== filterBtn && !filterBtn.contains(e.target)) {
       filterDropdown.classList.add('hidden');
    }
});
// Drag and Drop for Import File Input
const dropZone = document.querySelector('.border-dashed');
if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, preventDefaults, false); });
    ['dragenter', 'dragover'].forEach(eventName => { dropZone.addEventListener(eventName, highlight, false); });
    ['dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, unhighlight, false); });
    dropZone.addEventListener('drop', handleFileDrop, false);

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    function highlight() { dropZone.classList.add('border-blue-500', 'bg-blue-50'); }
    function unhighlight() { dropZone.classList.remove('border-blue-500', 'bg-blue-50'); }
    function handleFileDrop(e) {
        unhighlight(); // Remove highlight on drop
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0 && files[0].type === "application/json") {
            importFileInput.files = files;
            importFileInput.dispatchEvent(new Event('change')); // Trigger change event for button state
        } else if (files.length > 0) {
             alert("Please drop a valid JSON file (.json).");
        }
    }
} else { console.warn("Drag and drop zone element '.border-dashed' not found."); }
// Reminder Check Interval
const reminderInterval = setInterval(checkReminders, 60000);

// --- COMPLETELY REWRITTEN and CORRECTED saveNote function ---
async function saveNote() {
    // 1. Get data from editor modal
    let content = noteContent.innerHTML.trim();
    // Normalize empty content variations to a truly empty string
    if (content === placeholderText || content === '<p></p>' || content === '<p><br></p>') {
        content = '';
    }
    const title = noteTitle.value.trim();

    // Basic validation: Title or content required
    if (!title && !content) {
         alert('Note cannot be empty. Please enter a title or content.');
         noteTitle.focus(); // Focus title field as a hint
         return; // Stop execution
    }

    // Get other properties from the editor
    const color = document.querySelector('input[name="noteColor"]:checked')?.value || 'yellow';
    const dueDate = noteDueDate.value ? new Date(noteDueDate.value + 'T23:59:59').toISOString() : null;
    const priority = document.querySelector('input[name="notePriority"]:checked')?.value || 'medium';
    const reminder = noteReminder.value ? new Date(noteReminder.value).toISOString() : null;
    const pinned = notePinned.checked;
    const now = new Date().toISOString(); // Needed for updatedAt on updates

    // 2. Check mode: Update existing or Create new?
    if (currentNoteId) {
        // --- UPDATE PATH ---
        // Save state snapshot before making changes
        const existingNote = appState.notes.find(n => n.id === currentNoteId);
        if (existingNote) {
            saveStateSnapshot(`Edit note "${existingNote.title}"`);
        }
        
        // TODO: We still need to add tab selection to the editor and handle it here!
        // For now, updating a note doesn't change its tabId.
        console.log(`Attempting to UPDATE note ID: ${currentNoteId}`);
        try {
            // Find index in appState.notes
            const noteIndex = appState.notes.findIndex(n => n.id === currentNoteId);

            if (noteIndex !== -1) {
                // Create a shallow copy of the notes array to modify
                let updatedNotesArray = [...appState.notes];

                // Create the updated note object, merging old and new data
                // IMPORTANT: Keep the existing tabId when updating for now.
                const updatedNote = {
                    ...updatedNotesArray[noteIndex], // Keep existing id, createdAt, tabId
                    title: title,           // Use new title from editor
                    content: content,       // Use new content from editor
                    color: color,
                    dueDate: dueDate,       // Add due date
                    priority: priority,     // Add priority
                    reminder: reminder,
                    pinned: pinned,
                    updatedAt: now,         // Set new updated timestamp
                    // tabId is preserved from the spread (...) above
                    todoItems: currentTodoItems.length > 0 ? currentTodoItems : null  // Add todo items
                };

                // Replace the old note with the updated one in the copied array
                updatedNotesArray[noteIndex] = updatedNote;

                // Update the main appState
                appState.notes = updatedNotesArray;

                // Optimistic UI Update (re-render based on current selected tab)
                renderNotes();
                closeEditor();

                // Sync the entire appState with the backend (overwrite)
                await saveNotesToBackend(); // Uses POST /api/notes
                console.log(`Note ${currentNoteId} updated successfully on backend.`);
                showSaveConfirmation("Note updated successfully.");

            } else {
                // Defensive coding: Should not happen if currentNoteId is valid
                console.error(`Save Error: Note ID ${currentNoteId} not found in appState during update.`);
                alert("Error: Could not find the note to update locally. Please refresh.");
                closeEditor();
            }
        } catch (error) {
             // Backend save error is handled by saveNotesToBackend's catch block (shows alert)
             console.error("Error during note update or backend sync:", error);
             closeEditor(); // Still close editor
        }

    } else {
        // --- CREATE PATH (Corrected) ---
        // Save state snapshot before making changes
        saveStateSnapshot(`Create note "${title || 'Untitled'}"`);
        
        console.log("Attempting to CREATE new note.");
        // Prepare the raw data for the new note, INCLUDING the current tab ID
        const newNoteData = {
            title,
            content,
            color,
            dueDate,
            priority,
            reminder,
            pinned,
            // --- THIS IS THE KEY CHANGE ---
            // Assign null if 'all' is selected, otherwise use the specific course ID
            tabId: appState.currentSelectedCourseId === 'all' ? null : appState.currentSelectedCourseId,
            todoItems: currentTodoItems.length > 0 ? currentTodoItems : null  // Add todo items
        };
        console.log("Sending new note data with tabId:", newNoteData.tabId); // Log included tabId

        try {
            // Call the specific backend endpoint for adding a single note
            const createdNote = await addNoteToBackend(newNoteData); // Backend now gets tabId

            // If backend succeeds, it returns the full note object (including the tabId it saved)
            // Add the NEW note (received from backend) to the START of our local state
            appState.notes.unshift(createdNote);

            // Update UI
            renderNotes(); // Re-render notes (should show in the correct tab if that tab was selected)
            closeEditor();
            showSaveConfirmation("New note created successfully.");

        } catch (error) {
            // Error adding note via backend (alert is shown by addNoteToBackend's catch block)
            console.error("Failed to create new note via backend:", error);
            // Don't close the editor, allow user to retry or copy content
        }
    } // --- End of CREATE PATH ---
} // --- End of CORRECTED saveNote function ---
/**
 * Sends data for a single new note to the backend '/api/notes/add' endpoint.
 * @param {object} noteData Object containing title, content, color, reminder, pinned.
 * @returns {Promise<object>} A promise that resolves with the full note object created by the backend.
 * @throws {Error} Throws an error if the fetch fails or the server response is not 201.
 */
async function addNoteToBackend(noteData) {
    console.log('Sending new note data to backend add endpoint...', noteData);
    try {
        const response = await fetch(`${API_BASE_URL}/notes/add`, { // Target the specific ADD endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteData) // Send only the new note's data
        });

        const responseBody = await response.json().catch(() => ({})); // Try to parse JSON

        // Check specifically for 201 Created status
        if (!response.ok || response.status !== 201) {
             throw new Error(`HTTP error! status: ${response.status} - ${responseBody.message || 'Failed to create note on server'}`);
        }

        console.log('Backend add successful. Received created note:', responseBody);
        return responseBody; // Return the full note object from the backend

    } catch (error) { // <-- START of the SINGLE catch block for this function
        console.error('Error adding note via backend:', error); // Correct console log
        // Alert the user (can customize)
        alert(`Error creating note: ${error.message}`); // Correct alert
        throw error; // Re-throw the error for the caller function (`saveNote`)
    } // <-- END of the SINGLE catch block
} // <-- END of the function addNoteToBackend

// --- NEW: Function to save the ENTIRE app state to the backend (overwrite) ---
/**
 * Sends the entire appState object to the backend to overwrite the data.
 * @param {object} stateToSave The complete appState object ({tabs, notes}).
 * @returns {Promise<void>} A promise that resolves on success or rejects on error.
 * @throws {Error} Throws an error if the fetch fails or the server response is not OK.
 */
async function saveNotesToBackend(stateToSave = appState) { // Default to using current appState
    console.log('Attempting to save entire state to backend (overwrite)...', stateToSave);
    // Basic validation: Ensure we have the expected structure (support both courses and tabs)
    if (typeof stateToSave !== 'object' || stateToSave === null ||
        !Array.isArray(stateToSave.notes) || 
        (!Array.isArray(stateToSave.courses) && !Array.isArray(stateToSave.tabs))) {
        console.error("saveNotesToBackend: Invalid state object provided:", stateToSave);
        const errorMsg = "Error: Invalid data structure provided for saving.";
        alert(errorMsg); // Alert user immediately
        throw new Error(errorMsg); // Reject the promise
    }
    
    // Convert courses to tabs for backwards compatibility with backend
    const dataToSend = {
        ...stateToSave,
        tabs: stateToSave.courses || stateToSave.tabs || [],
        currentSelectedTabId: stateToSave.currentSelectedCourseId || stateToSave.currentSelectedTabId || 'all'
    };
    if (stateToSave.courses) {
        delete dataToSend.courses; // Remove courses field when sending to backend
        delete dataToSend.currentSelectedCourseId;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/notes`, { // Target the main overwrite endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend) // Send the converted state object
        });

        // Check if the response status indicates success (e.g., 200 OK)
        if (!response.ok) {
            // Try to get more details from the response body if possible
            const responseBody = await response.json().catch(() => ({})); // Avoid error if body isn't JSON
            throw new Error(`HTTP error! status: ${response.status} - ${responseBody.message || 'Failed to save notes on server'}`);
        }

        console.log('Backend save (overwrite) successful.');
        // No need to return data here, just resolve the promise implicitly
        // Optional: showSaveConfirmation("Changes saved successfully."); // Could add this later

    } catch (error) {
        console.error('Error saving notes to backend:', error);
        // Alert the user about the failure
        alert(`Error saving changes: ${error.message}. Your changes might not be persisted.`);
        throw error; // Re-throw the error so the calling function's .catch can react if needed
    }
}
// --- END OF NEW FUNCTION ---

// ========== NOTE RENDERING FUNCTIONS ==========

function renderNotes() {
    if (!notesGrid) { /* ... error handling ... */ return; }
    notesGrid.innerHTML = '';

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    let tempDiv = document.createElement('div');

    // Start with appState.notes and ensure it's an array
    let sourceNotes = Array.isArray(appState.notes) ? appState.notes : [];
    console.log(`Rendering. Source notes count: ${sourceNotes.length}, Selected Tab: ${appState.currentSelectedTabId}`); // Log selected tab

    // --- Apply Search Filter ---
    let filteredNotes = sourceNotes.filter(note => {
        const titleMatch = note.title?.toLowerCase().includes(searchTerm) ?? false;
        tempDiv.innerHTML = note.content ?? '';
        const contentMatch = tempDiv.textContent?.toLowerCase().includes(searchTerm) ?? false;
        return titleMatch || contentMatch;
    });
    console.log(`After search filter ('${searchTerm}'): ${filteredNotes.length} notes`);

    // --- >>> NEW: Apply Course Filter <<< ---
    if (appState.currentSelectedCourseId !== 'all') {
        filteredNotes = filteredNotes.filter(note => {
            // Handle special static courses
            if (appState.currentSelectedCourseId === 'work') {
                // Find the existing Work course ID
                const workCourse = appState.courses.find(course => course.name === 'Work');
                if (workCourse) {
                    return note.tabId === workCourse.id;
                }
                // Fallback: look for notes with null tabId as work notes
                return note.tabId === null;
            }
            
            // Check if the note's tabId matches the selected course ID (backwards compatibility)
            // Handle cases where note.tabId might be null or undefined carefully
            return note.tabId === appState.currentSelectedCourseId;
        });
        console.log(`After course filter ('${appState.currentSelectedCourseId}'): ${filteredNotes.length} notes`);
    } else {
        // If 'all' is selected, we don't filter by course here.
        // We might later decide *not* to show notes with a specific course in 'All',
        // but for now, 'all' shows everything that passes search/color filters.
        console.log("Course filter skipped ('all' selected).");
    }
    // --- >>> END NEW Course Filter <<< ---

    // --- Apply Color Filter ---
    if (currentFilterColor !== 'all') {
        filteredNotes = filteredNotes.filter(note => note.color === currentFilterColor);
        console.log(`After color filter ('${currentFilterColor}'): ${filteredNotes.length} notes`);
    }

    // --- Apply Sorting (Pinned first, then by selected sort order) ---
    const sortValue = sortSelect ? sortSelect.value : 'newest';
    let sortedNotes = [...filteredNotes]; // Create copy for sorting

    // Primary sort based on dropdown selection
    sortedNotes.sort((a, b) => {
        switch (sortValue) {
            case 'newest':
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'oldest':
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case 'title-asc':
                return (a.title || '').localeCompare(b.title || '');
            case 'title-desc':
                return (b.title || '').localeCompare(a.title || '');
            case 'due-date':
                // Sort by due date (nulls last, then by date)
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                // Sort by priority (high=3, medium=2, low=1)
                const priorityValues = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityValues[a.priority] || 2;
                const bPriority = priorityValues[b.priority] || 2;
                return bPriority - aPriority;
            default:
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });
    console.log(`After primary sort ('${sortValue}')`);

    // Secondary sort: Pinned notes always come first
    sortedNotes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    console.log(`After pin sort`);

    // --- Render the filtered and sorted notes ---
    if (sortedNotes.length > 0) {
       sortedNotes.forEach(note => {
           const noteElement = createNoteElement(note);
           if (noteElement) {
               notesGrid.appendChild(noteElement);
           } else {
               console.warn("Failed to create note element for:", note);
           }
       });
    } else {
        console.log("No notes to display after filtering/sorting.");
    }

    // --- Update UI elements ---
    updateNoteCount(sortedNotes.length); // Update count based on VISIBLE notes
    checkEmptyState(sortedNotes.length); // Check empty state based on VISIBLE notes
}

// ========== UI RENDERING FUNCTIONS ========== // Or similar section

// (Keep existing renderNotes, createNoteElement functions)

/**
 * Renders the course buttons in the course bar based on appState.courses.
 * Applies the default INACTIVE style initially.
 */
function renderCourses() {
    const dynamicCoursesContainer = document.getElementById('dynamicCourses');
    
    if (!dynamicCoursesContainer) {
        console.error("Course rendering failed: dynamicCourses container not found.");
        return;
    }

    // Clear existing dynamic courses
    dynamicCoursesContainer.innerHTML = '';

    // --- Define the INACTIVE classes (matching highlightActiveCourse) ---
    const inactiveClasses = ['bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-transparent', 'hover:bg-gray-300', 'dark:hover:bg-gray-600', 'font-medium'];

    // Check if appState.courses exists and is an array
    if (appState.courses && Array.isArray(appState.courses)) {
        console.log(`Rendering ${appState.courses.length} dynamic courses...`);
        appState.courses.forEach(course => {
            // Create container for course button and delete button
            const courseContainer = document.createElement('div');
            courseContainer.className = 'relative flex items-center group';
            courseContainer.draggable = true;
            courseContainer.dataset.courseId = course.id;

            const courseButton = document.createElement('button');
            courseButton.textContent = course.name;
            courseButton.dataset.courseId = course.id;
            courseButton.id = `course-${course.id}`;

            // --- Apply Base + INACTIVE styles ---
            courseButton.className = `course-button flex-shrink-0 px-4 py-2 pr-8 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer`;
            courseButton.classList.add(...inactiveClasses);

            // Add course color indicator
            if (course.color) {
                const colorIndicator = document.createElement('span');
                colorIndicator.className = 'inline-block w-3 h-3 rounded-full mr-2';
                colorIndicator.style.backgroundColor = course.color;
                courseButton.insertBefore(colorIndicator, courseButton.firstChild);
            }

            // Add click listener
            courseButton.addEventListener('click', handleCourseClick);

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'absolute right-1 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-full hover:bg-red-100';
            deleteButton.innerHTML = '<i class="fas fa-times text-xs"></i>';
            deleteButton.title = `Delete ${course.name}`;
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent course selection
                deleteCourse(course.id, course.name);
            });

            // Add drag and drop event listeners for course reordering
            courseContainer.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', course.id);
                courseContainer.classList.add('opacity-50');
                console.log(`Drag started for course: ${course.name}`);
            });
            
            courseContainer.addEventListener('dragend', (e) => {
                courseContainer.classList.remove('opacity-50');
                console.log(`Drag ended for course: ${course.name}`);
            });
            
            courseContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                courseContainer.classList.add('bg-blue-100');
            });
            
            courseContainer.addEventListener('dragleave', (e) => {
                courseContainer.classList.remove('bg-blue-100');
            });
            
            courseContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                courseContainer.classList.remove('bg-blue-100');
                
                const draggedData = e.dataTransfer.getData('text/plain');
                const targetCourseId = course.id;
                
                // Check if we're dragging a course or a note
                if (draggedData.startsWith('note-')) {
                    // It's a note being dragged
                    const noteId = draggedData.replace('note-', '');
                    moveNoteToCourse(noteId, targetCourseId);
                } else {
                    // It's a course being dragged
                    const draggedCourseId = draggedData;
                    if (draggedCourseId !== targetCourseId) {
                        reorderCourses(draggedCourseId, targetCourseId);
                    }
                }
            });

            // Assemble the course container
            courseContainer.appendChild(courseButton);
            courseContainer.appendChild(deleteButton);

            // Insert the container
            dynamicCoursesContainer.appendChild(courseContainer);
        });
    } else {
        console.log("No dynamic courses to render or appState.courses is not an array.");
    }
    // Note: highlightActiveCourse() will be called separately after this runs during initialization
}

/**
 * Renders the tab buttons in the tab bar based on appState.tabs.
 * Applies the default INACTIVE style initially.
 */
function renderTabs() {
    const dynamicTabsContainer = document.getElementById('dynamicTabs');
    const addTabBtn = document.getElementById('addTabBtn');

    if (!dynamicTabsContainer || !addTabBtn) {
        console.error("Tab rendering failed: dynamicTabs container or addTabBtn not found.");
        return;
    }

    // Clear existing dynamic tabs
    dynamicTabsContainer.innerHTML = '';

    // --- Define the INACTIVE classes (matching highlightActiveTab) ---
    const inactiveClasses = ['bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-transparent', 'hover:bg-gray-300', 'dark:hover:bg-gray-600', 'font-medium'];

    // Check if appState.tabs exists and is an array
    if (appState.tabs && Array.isArray(appState.tabs)) {
        console.log(`Rendering ${appState.tabs.length} dynamic tabs...`);
        appState.tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.textContent = tab.name;
            tabButton.dataset.tabId = tab.id;
            tabButton.id = `tab-${tab.id}`;

            // --- Apply Base + INACTIVE styles ---
            // 1. Set base structural/layout/focus classes
            tabButton.className = `tab-button flex-shrink-0 px-4 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`; // Added 'border' for layout consistency
            // 2. Add the specific inactive style classes using classList.add
            tabButton.classList.add(...inactiveClasses);

            // Add click listener
            tabButton.addEventListener('click', handleTabClick);

            // Insert the button
            dynamicTabsContainer.appendChild(tabButton);
        });
    } else {
        console.log("No dynamic tabs to render or appState.tabs is not an array.");
    }
    // Note: highlightActiveTab() will be called separately after this runs during initialization
}

/**
 * Handles course clicks. Updates the current selected course state and re-renders notes.
 * @param {Event} event The click event object.
 */
function handleCourseClick(event) {
    const clickedCourseId = event.currentTarget.dataset.courseId;
    console.log(`Course clicked: ID = ${clickedCourseId}. Updating state and re-rendering notes.`);

    // --- UPDATE STATE ---
    appState.currentSelectedCourseId = clickedCourseId;

    // --- RE-RENDER NOTES ---
    // This will now use the updated currentSelectedCourseId to filter
    renderNotes();

    // --- HIGHLIGHT ACTIVE COURSE ---
    highlightActiveCourse();
    console.log("Current selected course ID:", appState.currentSelectedCourseId);
}

function handleStaticCourseClick(staticCourseId) {
    console.log(`Static course clicked: ${staticCourseId}`);
    appState.currentSelectedCourseId = staticCourseId;
    renderNotes();
    highlightActiveCourse();
    console.log("Current selected course ID:", appState.currentSelectedCourseId);
}

function addDropSupportToStaticCourse(buttonElement, courseId) {
    buttonElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        buttonElement.classList.add('bg-blue-100');
    });
    
    buttonElement.addEventListener('dragleave', (e) => {
        buttonElement.classList.remove('bg-blue-100');
    });
    
    buttonElement.addEventListener('drop', (e) => {
        e.preventDefault();
        buttonElement.classList.remove('bg-blue-100');
        
        const draggedData = e.dataTransfer.getData('text/plain');
        
        // Only handle note drops (not course drops) on static buttons
        if (draggedData.startsWith('note-')) {
            const noteId = draggedData.replace('note-', '');
            moveNoteToCourse(noteId, courseId);
        }
    });
}

/**
 * Handles tab clicks. Updates the current selected tab state and re-renders notes.
 * @param {Event} event The click event object.
 */
function handleTabClick(event) {
    const clickedTabId = event.currentTarget.dataset.tabId;
    console.log(`Tab clicked: ID = ${clickedTabId}. Updating state and re-rendering notes.`);

    // --- UPDATE STATE ---
    appState.currentSelectedTabId = clickedTabId;

    // --- RE-RENDER NOTES ---
    // This will now use the updated currentSelectedTabId to filter
    renderNotes();

    // --- HIGHLIGHT ACTIVE TAB (Placeholder for next step) ---
    // We will call a function here later to visually update the tabs
    highlightActiveTab(); // Example call
    console.log("Current selected tab ID:", appState.currentSelectedTabId); // Verify state update
}


/**
 * Opens the course creation modal
 */
function openCourseModal() {
    // We'll implement this after adding the DOM references
    console.log("Opening course modal...");
    const courseModal = document.getElementById('courseModal');
    if (courseModal) {
        courseModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // Focus on course name input
        const courseNameInput = document.getElementById('courseName');
        if (courseNameInput) courseNameInput.focus();
    }
}

/**
 * Updates the visual appearance of course buttons to highlight the currently active one.
 */
function highlightActiveCourse() {
    // Define the classes for active and inactive states
    const activeClasses = ['bg-yellow-400', 'text-gray-800', 'border-yellow-400', 'font-semibold'];
    const inactiveClasses = ['bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-transparent', 'hover:bg-gray-300', 'dark:hover:bg-gray-600', 'font-medium'];

    // Update "All Notes" course button
    const allNotesCourseBtn = document.getElementById('course-all');
    if (allNotesCourseBtn) {
        allNotesCourseBtn.classList.remove(...activeClasses, ...inactiveClasses);
        if (appState.currentSelectedCourseId === 'all') {
            allNotesCourseBtn.classList.add(...activeClasses);
        } else {
            allNotesCourseBtn.classList.add(...inactiveClasses);
        }
    }

    // Update "Work" course button
    const workCourseBtn = document.getElementById('course-work');
    if (workCourseBtn) {
        workCourseBtn.classList.remove(...activeClasses, ...inactiveClasses);
        if (appState.currentSelectedCourseId === 'work') {
            workCourseBtn.classList.add(...activeClasses);
        } else {
            workCourseBtn.classList.add(...inactiveClasses);
        }
    }

    // Update dynamic course buttons
    if (appState.courses && Array.isArray(appState.courses)) {
        appState.courses.forEach(course => {
            const courseBtn = document.getElementById(`course-${course.id}`);
            if (courseBtn) {
                courseBtn.classList.remove(...activeClasses, ...inactiveClasses);
                if (appState.currentSelectedCourseId === course.id) {
                    courseBtn.classList.add(...activeClasses);
                } else {
                    courseBtn.classList.add(...inactiveClasses);
                }
            }
        });
    }
}

/**
 * Updates the visual appearance of tab buttons to highlight the currently active one.
 */
function highlightActiveTab() {
    const currentTabId = appState.currentSelectedTabId;
    console.log(`Highlighting active tab: ${currentTabId}`);

    // --- UPDATED Style Definitions ---
    const activeClasses = ['bg-yellow-400', 'text-gray-900', 'border-yellow-500', 'dark:border-yellow-600', 'font-semibold']; // Strong yellow background
    const inactiveClasses = ['bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-transparent', 'hover:bg-gray-300', 'dark:hover:bg-gray-600', 'font-medium']; // Neutral gray background, transparent border

    const allTabButtons = document.querySelectorAll('#tabBarContainer [data-tab-id]');

    allTabButtons.forEach(button => {
        if (button.dataset.tabId === currentTabId) {
            // Apply Active Styles
            button.classList.remove(...inactiveClasses);
            button.classList.add(...activeClasses);
            button.classList.add('border'); // Ensure border is explicitly added for active
        } else {
            // Apply Inactive Styles
            button.classList.remove(...activeClasses);
            button.classList.remove('border'); // Remove explicit border if it was added
            button.classList.add(...inactiveClasses);
        }
    });
}

function createNoteElement(note) {
    const noteElement = document.createElement('div');
    noteElement.className = `sticky-note ${note.color || 'yellow'} relative p-4 animate-fade-in cursor-pointer group`;
    noteElement.dataset.id = note.id;
    noteElement.draggable = true;
    noteElement.addEventListener('dragstart', handleDragStart);
    noteElement.addEventListener('dragover', handleDragOver);
    noteElement.addEventListener('dragenter', handleDragEnter);
    noteElement.addEventListener('dragleave', handleDragLeave);
    noteElement.addEventListener('drop', handleDrop);
    noteElement.addEventListener('dragend', handleDragEnd);

    if (note.pinned) { /* ... add pin ... */
        const pin = document.createElement('div'); pin.className = 'note-pin'; noteElement.appendChild(pin);
    }
    
    // Add priority indicator
    if (note.priority && note.priority !== 'medium') {
        const priorityIndicator = document.createElement('div');
        priorityIndicator.className = 'absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium';
        
        if (note.priority === 'high') {
            priorityIndicator.className += ' bg-red-100 text-red-800';
            priorityIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> HIGH';
        } else if (note.priority === 'low') {
            priorityIndicator.className += ' bg-green-100 text-green-800';
            priorityIndicator.innerHTML = '<i class="fas fa-arrow-down"></i> LOW';
        }
        
        noteElement.appendChild(priorityIndicator);
    }

    // Add due date indicator
    if (note.dueDate) {
        const dueDateIndicator = document.createElement('div');
        const dueDate = new Date(note.dueDate);
        const today = new Date();
        const isOverdue = dueDate < today;
        const isToday = dueDate.toDateString() === today.toDateString();
        const isTomorrow = dueDate.toDateString() === new Date(today.getTime() + 24*60*60*1000).toDateString();
        
        dueDateIndicator.className = 'absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium';
        
        if (isOverdue) {
            dueDateIndicator.className += ' bg-red-100 text-red-800 border border-red-300';
            dueDateIndicator.innerHTML = '<i class="fas fa-exclamation-circle"></i> OVERDUE';
        } else if (isToday) {
            dueDateIndicator.className += ' bg-orange-100 text-orange-800 border border-orange-300';
            dueDateIndicator.innerHTML = '<i class="fas fa-clock"></i> TODAY';
        } else if (isTomorrow) {
            dueDateIndicator.className += ' bg-yellow-100 text-yellow-800 border border-yellow-300';
            dueDateIndicator.innerHTML = '<i class="fas fa-calendar-day"></i> TOMORROW';
        } else {
            dueDateIndicator.className += ' bg-blue-100 text-blue-800';
            dueDateIndicator.innerHTML = `<i class="fas fa-calendar"></i> ${formatDate(dueDate, 'display')}`;
        }
        
        noteElement.appendChild(dueDateIndicator);
    }

    // Add todo indicator if note has todo items
    if (note.todoItems && note.todoItems.length > 0) {
        const todoIndicator = document.createElement('div');
        todoIndicator.className = 'absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium';
        const completedCount = note.todoItems.filter(item => item.completed).length;
        todoIndicator.innerHTML = `<i class="fas fa-list-check"></i> ${completedCount}/${note.todoItems.length}`;
        noteElement.appendChild(todoIndicator);
    }

    const noteHeader = document.createElement('div');
    noteHeader.className = 'flex justify-between items-start mb-2';
    const noteTitleEl = document.createElement('h3');
    noteTitleEl.className = 'font-bold truncate flex-grow mr-2';
    noteTitleEl.textContent = note.title || 'Untitled Note';
    noteHeader.appendChild(noteTitleEl);

    const quickDeleteBtn = document.createElement('button');
    quickDeleteBtn.className = 'text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100';
    quickDeleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    quickDeleteBtn.setAttribute('aria-label', `Delete note ${note.title || 'Untitled Note'}`);
    quickDeleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${note.title || 'Untitled'}"?`)) {
            // Save state snapshot before deleting
            saveStateSnapshot(`Delete note "${note.title || 'Untitled'}"`);
            // Call deleteNoteById directly
            deleteNoteById(note.id)
                .catch(() => { /* Error handling done in deleteNoteById */ });
        }
    };
    noteHeader.appendChild(quickDeleteBtn);
    noteElement.appendChild(noteHeader);

    const notePreview = document.createElement('div');
    notePreview.className = 'text-sm mb-3 line-clamp-3 break-words';
    const tempDiv = document.createElement('div'); // Create here is fine
    tempDiv.innerHTML = note.content || '';
    const previewText = tempDiv.textContent || '';
    notePreview.textContent = previewText.substring(0, 120) + (previewText.length > 120 ? '...' : '');
    noteElement.appendChild(notePreview);

    const noteFooter = document.createElement('div');
    noteFooter.className = 'flex justify-between items-center text-xs text-gray-600 mt-auto pt-2 border-t border-gray-300 border-opacity-50';
    const dateAndReminder = document.createElement('div');
    dateAndReminder.className = 'flex items-center';

    if (note.reminder && new Date(note.reminder) > new Date()) {
        const reminderIcon = document.createElement('i');
        const reminderDate = new Date(note.reminder);
        const hoursUntilReminder = (reminderDate - new Date()) / 3600000;
        const isSoon = hoursUntilReminder <= 24;
        reminderIcon.className = `far fa-bell mr-1 ${isSoon ? 'text-orange-500 fas' : 'text-gray-500'}`;
        reminderIcon.title = `${isSoon ? 'Reminder soon' : 'Reminder set'}: ${formatDateTime(note.reminder)}`;
        dateAndReminder.appendChild(reminderIcon);
    }

    const noteDate = document.createElement('span');
    const createDate = note.createdAt || new Date().toISOString(); // Handle missing create date
    noteDate.textContent = formatDate(createDate);
    noteDate.title = `Created: ${formatDateTime(createDate)}`;
    dateAndReminder.appendChild(noteDate);
    noteFooter.appendChild(dateAndReminder);
    noteElement.appendChild(noteFooter);

    noteElement.addEventListener('click', () => { viewNote(note.id); });
    return noteElement;
}


// ========== EDITOR MODAL FUNCTIONS ==========

function openNewNoteEditor() {
    currentNoteId = null; resetEditor(); editorTitle.textContent = 'New Note';
    deleteNoteBtn.classList.add('hidden'); editorModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; if(noteTitle) noteTitle.focus();
}
function openNoteEditor(noteId) {
    const note = appState.notes.find(n => n.id === noteId); // Use appState.notes
    if (note) {
        currentNoteId = noteId; editorTitle.textContent = 'Edit Note'; deleteNoteBtn.classList.remove('hidden');
        noteTitle.value = note.title || ''; noteContent.innerHTML = note.content || '<p></p>';
        noteContent.classList.remove(placeholderColor); noteContent.classList.add(editorTextColor);
        const colorRadio = document.querySelector(`input[name="noteColor"][value="${note.color || 'yellow'}"]`);
        if (colorRadio) colorRadio.checked = true;
        noteDueDate.value = note.dueDate ? formatDateOnly(new Date(note.dueDate)) : '';
        const priorityRadio = document.querySelector(`input[name="notePriority"][value="${note.priority || 'medium'}"]`);
        if (priorityRadio) priorityRadio.checked = true;
        noteReminder.value = note.reminder ? formatDateTimeLocal(new Date(note.reminder)) : '';
        notePinned.checked = note.pinned || false;
        
        // Load todo items if they exist
        if (note.todoItems && note.todoItems.length > 0) {
            currentTodoItems = [...note.todoItems];
            todoContainer.classList.remove('hidden');
            toggleTodoBtn.innerHTML = '<i class="fas fa-sticky-note mr-1"></i> Regular Note';
            renderTodoList();
        } else {
            resetTodoList();
        }
        
        editorModal.classList.remove('hidden'); document.body.style.overflow = 'hidden';
    } else { console.error(`Note ID ${noteId} not found.`); alert("Error: Note not found."); }
}
function resetEditor() {
    currentNoteId = null; noteTitle.value = ''; noteContent.innerHTML = placeholderText;
    noteContent.classList.add(placeholderColor); noteContent.classList.remove(editorTextColor);
    const defaultColorRadio = document.querySelector('input[name="noteColor"][value="yellow"]');
    if (defaultColorRadio) defaultColorRadio.checked = true;
    noteDueDate.value = '';
    const defaultPriorityRadio = document.querySelector('input[name="notePriority"][value="medium"]');
    if (defaultPriorityRadio) defaultPriorityRadio.checked = true;
    setDefaultReminderTime(); notePinned.checked = false; deleteNoteBtn.classList.add('hidden');
    // Reset todo list
    resetTodoList();
}
function closeEditor() {
   editorModal.classList.add('hidden'); document.body.style.overflow = ''; /* resetEditor(); */
}

function deleteNote() { // Called from Editor modal delete button
    if (!currentNoteId) return;
    const noteToDelete = appState.notes.find(n => n.id === currentNoteId); // Use appState.notes
    const noteTitleForConfirm = noteToDelete ? `"${noteToDelete.title}"` : "this note";

    if (confirm(`Are you sure you want to delete ${noteTitleForConfirm}? This cannot be undone.`)) {
        // Save state snapshot before making changes
        if (noteToDelete) {
            saveStateSnapshot(`Delete note "${noteToDelete.title}"`);
        }
        const noteIdToDelete = currentNoteId; // Capture id before closing editor
        closeEditor(); // Close editor first
        deleteNoteById(noteIdToDelete)
            .catch(() => { /* Error alert handled in deleteNoteById */ });
    }
}

/**
 * Deletes note by ID, updates UI optimistically, saves to backend, reverts UI on error.
 * @param {string} noteIdToDelete
 * @returns {Promise<void>}
 */
async function deleteNoteById(noteIdToDelete) {
    const initialNotes = [...appState.notes];
    console.log(`Attempting to delete note ID: ${noteIdToDelete}`);

    // Optimistic UI Update
    appState.notes = appState.notes.filter(note => note.id !== noteIdToDelete);
    renderNotes(); // Update UI immediately

    try {
        await saveNotesToBackend(); // Send the filtered array to backend
        console.log(`Deleted note ID: ${noteIdToDelete} and saved to backend successfully.`);
        // Optional: Show success confirmation
        // showSaveConfirmation("Note deleted successfully.");
    } catch (error) {
        // Revert UI state if backend save failed
        console.error(`Failed to confirm delete on backend for ID ${noteIdToDelete}. Reverting UI.`);
            appState.notes = initialNotes; // FIX: Restore the notes array within appState
        renderNotes(); // Re-render to show the note again
        // Error alert is already shown by saveNotesToBackend
        throw error; // Re-throw for potential callers if needed
    }
}

// ========== TODO LIST FUNCTIONS ==========
let currentTodoItems = [];

function toggleTodoMode() {
    const isVisible = !todoContainer.classList.contains('hidden');
    
    if (isVisible) {
        // Hide todo list
        todoContainer.classList.add('hidden');
        toggleTodoBtn.innerHTML = '<i class="fas fa-list-check mr-1"></i> Convert to Todo';
        currentTodoItems = [];
        renderTodoList();
    } else {
        // Show todo list
        todoContainer.classList.remove('hidden');
        toggleTodoBtn.innerHTML = '<i class="fas fa-sticky-note mr-1"></i> Regular Note';
        // If editing existing note with todos, load them
        if (currentNoteId) {
            const note = appState.notes.find(n => n.id === currentNoteId);
            if (note && note.todoItems) {
                currentTodoItems = [...note.todoItems];
                renderTodoList();
            }
        }
    }
}

function addTodoItem() {
    const text = newTodoInput.value.trim();
    if (!text) return;
    
    const todoItem = {
        id: `todo-${Date.now()}`,
        text: text,
        completed: false
    };
    
    currentTodoItems.push(todoItem);
    newTodoInput.value = '';
    renderTodoList();
}

function renderTodoList() {
    todoList.innerHTML = '';
    
    currentTodoItems.forEach(item => {
        const todoDiv = document.createElement('div');
        todoDiv.className = 'todo-item';
        todoDiv.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${item.completed ? 'checked' : ''} 
                data-id="${item.id}">
            <span class="todo-text ${item.completed ? 'completed' : ''}">${item.text}</span>
            <button class="todo-delete" data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Add event listeners
        const checkbox = todoDiv.querySelector('.todo-checkbox');
        checkbox.addEventListener('change', () => toggleTodoComplete(item.id));
        
        const deleteBtn = todoDiv.querySelector('.todo-delete');
        deleteBtn.addEventListener('click', () => deleteTodoItem(item.id));
        
        todoList.appendChild(todoDiv);
    });
}

function toggleTodoComplete(todoId) {
    const item = currentTodoItems.find(t => t.id === todoId);
    if (item) {
        item.completed = !item.completed;
        renderTodoList();
    }
}

function deleteTodoItem(todoId) {
    currentTodoItems = currentTodoItems.filter(t => t.id !== todoId);
    renderTodoList();
}

function resetTodoList() {
    currentTodoItems = [];
    todoContainer.classList.add('hidden');
    toggleTodoBtn.innerHTML = '<i class="fas fa-list-check mr-1"></i> Convert to Todo';
    newTodoInput.value = '';
    renderTodoList();
}

// ========== COURSE MODAL FUNCTIONS ==========
function closeCourseModal() {
    console.log('closeCourseModal function called');
    const courseModal = document.getElementById('courseModal');
    const courseName = document.getElementById('courseName');
    const courseInstructor = document.getElementById('courseInstructor');
    
    if (courseModal) {
        console.log('Closing course modal...');
        courseModal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Reset form
        if (courseName) courseName.value = '';
        if (courseInstructor) courseInstructor.value = '';
        
        // Reset color selection to blue (first option)
        const defaultColorRadio = document.querySelector('input[name="courseColor"][value="#3b82f6"]');
        if (defaultColorRadio) defaultColorRadio.checked = true;
        
        // Reset semester to default
        const courseSemester = document.getElementById('courseSemester');
        if (courseSemester) courseSemester.value = 'Spring 2025';
        
        console.log('Course modal closed successfully');
    } else {
        console.error('Course modal element not found');
    }
}

async function moveNoteToCourse(noteId, targetCourseId) {
    try {
        // Save state snapshot before making changes
        // Find the note
        const note = appState.notes.find(n => n.id === noteId);
        if (note) {
            const targetName = targetCourseId === 'all' ? 'All Notes' : 
                              targetCourseId === 'work' ? 'Work' : 
                              appState.courses.find(c => c.id === targetCourseId)?.name || 'Unknown';
            saveStateSnapshot(`Move "${note.title}" to ${targetName}`);
        }
        
        console.log(`Moving note ${noteId} to course ${targetCourseId}`);
        if (!note) {
            console.error('Note not found for moving');
            return;
        }
        
        // Handle special static courses
        let actualTargetId = targetCourseId;
        if (targetCourseId === 'work') {
            // Find the existing Work course ID
            const workCourse = appState.courses.find(course => course.name === 'Work');
            actualTargetId = workCourse ? workCourse.id : null;
        } else if (targetCourseId === 'all') {
            // Moving to 'All Notes' means removing course association
            actualTargetId = null;
        }
        
        // Update the note's tabId
        note.tabId = actualTargetId;
        note.updatedAt = new Date().toISOString();
        
        // Save changes to backend
        await saveNotesToBackend();
        
        // Re-render notes to reflect changes
        renderNotes();
        
        // Show confirmation
        const targetName = targetCourseId === 'all' ? 'All Notes' : 
                          targetCourseId === 'work' ? 'Work' : 
                          appState.courses.find(c => c.id === targetCourseId)?.name || 'Unknown';
        showConfirmationMessage(`Note moved to "${targetName}"`);
        
        console.log(`Note moved successfully to ${targetName}`);
        
    } catch (error) {
        console.error('Error moving note to course:', error);
        alert('Failed to move note. Please try again.');
    }
}

async function reorderCourses(draggedCourseId, targetCourseId) {
    try {
        // Save state snapshot before making changes
        const draggedCourse = appState.courses.find(c => c.id === draggedCourseId);
        if (draggedCourse) {
            saveStateSnapshot(`Reorder course "${draggedCourse.name}"`);
        }
        
        console.log(`Reordering courses: moving ${draggedCourseId} to position of ${targetCourseId}`);
        
        // Find the courses
        const draggedIndex = appState.courses.findIndex(course => course.id === draggedCourseId);
        const targetIndex = appState.courses.findIndex(course => course.id === targetCourseId);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            console.error('Could not find courses for reordering');
            return;
        }
        
        // Remove the dragged course from its current position
        const [movedCourse] = appState.courses.splice(draggedIndex, 1);
        
        // Insert it at the target position
        appState.courses.splice(targetIndex, 0, movedCourse);
        
        // Save changes to backend
        await saveNotesToBackend();
        
        // Re-render courses to reflect new order
        renderCourses();
        highlightActiveCourse();
        
        console.log('Course reordering completed successfully');
        
    } catch (error) {
        console.error('Error reordering courses:', error);
        alert('Failed to reorder courses. Please try again.');
    }
}

async function deleteCourse(courseId, courseName) {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the course "${courseName}"?\n\nThis will also remove all notes associated with this course.`)) {
        return;
    }
    
    try {
        // Save state snapshot before making changes
        saveStateSnapshot(`Delete course "${courseName}"`);
        
        console.log(`Deleting course: ${courseName} (ID: ${courseId})`);
        
        // Remove course from appState
        appState.courses = appState.courses.filter(course => course.id !== courseId);
        
        // Remove all notes associated with this course
        appState.notes = appState.notes.filter(note => note.tabId !== courseId);
        
        // If we're currently viewing the deleted course, switch to 'All Notes'
        if (appState.currentSelectedCourseId === courseId) {
            appState.currentSelectedCourseId = 'all';
        }
        
        // Save changes to backend
        await saveNotesToBackend();
        
        // Update UI
        renderCourses();
        renderNotes();
        highlightActiveCourse();
        
        // Show confirmation message
        showConfirmationMessage(`Course "${courseName}" and its notes have been deleted.`);
        
        console.log(`Course "${courseName}" deleted successfully`);
        
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course. Please try again.');
    }
}

async function saveCourse() {
    // Get elements fresh (in case of timing issues)
    const courseNameElement = document.getElementById('courseName');
    const courseSemesterElement = document.getElementById('courseSemester');
    const courseInstructorElement = document.getElementById('courseInstructor');
    
    if (!courseNameElement) {
        console.error('Course name element not found');
        alert('Error: Course form not loaded properly. Please try again.');
        return;
    }
    
    const name = courseNameElement.value.trim();
    if (!name) {
        alert('Please enter a course name.');
        courseNameElement.focus();
        return;
    }

    const color = document.querySelector('input[name="courseColor"]:checked')?.value || '#3b82f6';
    const semester = courseSemesterElement ? courseSemesterElement.value : 'Current';
    const instructor = courseInstructorElement ? courseInstructorElement.value.trim() : '';

    const courseData = { name, color, semester, instructor };
    
    // Save state snapshot before making changes
    saveStateSnapshot(`Create course "${name}"`);

    try {
        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
        });

        if (response.ok) {
            const newCourse = await response.json();
            appState.courses.push(newCourse);
            renderCourses();
            highlightActiveCourse();
            closeCourseModal();
            console.log('Course created successfully:', newCourse);
        } else {
            const error = await response.json();
            alert(`Error creating course: ${error.message}`);
        }
    } catch (error) {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
    }
}

function viewNote(noteId) {
    // const note = notes.find(n => n.id === noteId); // <-- Delete or comment out this line
    const note = appState.notes.find(n => n.id === noteId); // <-- Add this corrected line
    if (note) {
        currentNoteId = noteId;
        viewNoteTitle.textContent = note.title || 'Untitled Note';
        viewNoteDate.textContent = `Created: ${formatDate(note.createdAt || '?')}`;
        viewNoteTime.textContent = `Updated: ${formatTime(note.updatedAt || '?')}`;
        // Display content and metadata
        let contentHtml = note.content || '';
        
        // Add priority and due date info
        if (note.priority || note.dueDate) {
            contentHtml += '<div class="mt-4 border-t pt-4 flex gap-4">';
            
            if (note.priority) {
                const priorityClass = note.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                    note.priority === 'low' ? 'bg-green-100 text-green-800' : 
                                    'bg-yellow-100 text-yellow-800';
                contentHtml += `<div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityClass}">
                    <i class="fas fa-flag mr-1"></i> ${note.priority.toUpperCase()} Priority
                </div>`;
            }
            
            if (note.dueDate) {
                const dueDate = new Date(note.dueDate);
                const today = new Date();
                const isOverdue = dueDate < today;
                const dueDateClass = isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
                contentHtml += `<div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${dueDateClass}">
                    <i class="fas fa-calendar mr-1"></i> Due: ${formatDate(dueDate, 'display')}
                    ${isOverdue ? ' (OVERDUE)' : ''}
                </div>`;
            }
            
            contentHtml += '</div>';
        }
        
        // Add todo items if they exist
        if (note.todoItems && note.todoItems.length > 0) {
            contentHtml += '<div class="mt-4 border-t pt-4">';
            contentHtml += '<h4 class="font-semibold mb-2">Todo List:</h4>';
            contentHtml += '<ul class="space-y-1">';
            note.todoItems.forEach(item => {
                const checkedClass = item.completed ? 'line-through text-gray-500' : '';
                const checkbox = item.completed ? '☑' : '☐';
                contentHtml += `<li class="${checkedClass}">${checkbox} ${item.text}</li>`;
            });
            contentHtml += '</ul>';
            contentHtml += '</div>';
        }
        
        viewNoteContent.innerHTML = contentHtml || '(No content)';

        if (note.reminder) {
            viewNoteReminder.classList.remove('hidden', 'bg-blue-50', 'text-blue-800', 'bg-red-50', 'text-red-800');
            const reminderDate = new Date(note.reminder);
            reminderText.textContent = `Reminder: ${formatDateTime(reminderDate)}`;
            const isPastDue = reminderDate <= new Date();
            viewNoteReminder.className = `px-4 py-2 rounded-lg mb-4 flex items-center ${isPastDue ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`; // Use className assignment
            if (isPastDue) reminderText.textContent += " (Past)";
        } else {
            viewNoteReminder.classList.add('hidden');
        }
        noteViewModal.classList.remove('hidden'); document.body.style.overflow = 'hidden';
    } else { console.error(`Note ID ${noteId} not found.`); alert("Error: Note not found."); }
}

// ========== UI HELPER FUNCTIONS ==========
function showSaveConfirmation(message, isError = false) {
    const confirmationBox = document.getElementById('confirmationMessage');
    if (!confirmationBox) return;
    confirmationBox.textContent = message;
    if (confirmationTimeout) clearTimeout(confirmationTimeout);
    confirmationBox.className = `fixed bottom-4 right-4 text-white text-sm py-2 px-4 rounded-lg shadow-md transition-opacity duration-300 ease-in-out z-50 pointer-events-none ${isError ? 'bg-red-600' : 'bg-green-600'} opacity-100`; // Use className
    confirmationTimeout = setTimeout(() => {
        confirmationBox.classList.add('opacity-0'); confirmationTimeout = null;
    }, 3001);
}

// FIX: Update default parameter to use appState.notes
function checkEmptyState(count = appState.notes.length) {
    if (!emptyState || !notesGrid) return;
    const isEmpty = count === 0;
    emptyState.classList.toggle('hidden', !isEmpty);
    notesGrid.classList.toggle('hidden', isEmpty);
    if (emptyStateNewNoteBtn) {
        emptyStateNewNoteBtn.style.display = isEmpty ? 'inline-block' : 'none'; // Use style.display
    }
}

// FIX: Update default parameter to use appState.notes
function updateNoteCount(count = appState.notes.length) {
   if (!noteCount) return; noteCount.textContent = `${count} ${count === 1 ? 'note' : 'notes'}`;
}

// ========== REMINDER FUNCTIONS ==========
function checkReminders() {
    const now = new Date();
    appState.notes.forEach(note => {
        if (note.reminder && !note._sessionNotified && new Date(note.reminder) <= now) {
            console.log(`Reminder due for note: "${note.title}"`);
            showReminderNotification(note); note._sessionNotified = true;
        }
    });
}
function showReminderNotification(note) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const title = `Reminder: ${note.title || 'Untitled Note'}`;
    const tempDiv = document.createElement('div'); tempDiv.innerHTML = note.content || '';
    const bodyText = (tempDiv.textContent || '').substring(0, 100) + (tempDiv.textContent.length > 100 ? '...' : '');
    const options = { body: bodyText || 'Check your note!', icon: 'https://via.placeholder.com/48' }; // Placeholder icon
    try {
       const notification = new Notification(title, options);
       notification.onclick = () => { window.focus(); viewNote(note.id); };
    } catch (e) { console.error("Notification error:", e); }
}

// ========== IMPORT/EXPORT FUNCTIONS ==========
function exportNotes(forcedFilename = null, showConfirmation = false) {
    // ... (Keep existing exportNotes logic - it works on current 'notes' state) ...
     if (!appState.notes || appState.notes.length === 0) { alert("There are no notes to export."); return; } // Use appState.notes
    try {
        // Export ONLY the notes array, not the whole appState
    const notesToExport = Array.isArray(appState.notes) ? appState.notes : [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notesToExport, null, 2)); // Use notesToExport
        const downloadAnchor = document.createElement('a');
        const filename = forcedFilename ? forcedFilename : `sticky-notes-backup-${formatDate(new Date(), 'file')}.json`;
        downloadAnchor.setAttribute("href", dataStr); downloadAnchor.setAttribute("download", filename);
        document.body.appendChild(downloadAnchor); downloadAnchor.click(); document.body.removeChild(downloadAnchor);
        console.log(`Export: Initiated download for ${filename}`);
        if (showConfirmation) showSaveConfirmation(`Download started: ${filename}`);
    } catch (e) { console.error("Error exporting notes:", e); showSaveConfirmation("Error exporting notes!", true); }
}
// ========== IMPORT/EXPORT FUNCTIONS ==========
function exportNotes(forcedFilename = null, showConfirmation = false) {
    // ... (Keep existing exportNotes logic - it works on appState.notes) ...
     if (!appState.notes || appState.notes.length === 0) { alert("There are no notes to export."); return; }
    try {
        // Export ONLY the notes array, not the whole appState
        const notesToExport = Array.isArray(appState.notes) ? appState.notes : [];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notesToExport, null, 2));
        const downloadAnchor = document.createElement('a');
        const filename = forcedFilename ? forcedFilename : `sticky-notes-backup-${formatDate(new Date(), 'file')}.json`;
        downloadAnchor.setAttribute("href", dataStr); downloadAnchor.setAttribute("download", filename);
        document.body.appendChild(downloadAnchor); downloadAnchor.click(); document.body.removeChild(downloadAnchor);
        console.log(`Export: Initiated download for ${filename}`);
        if (showConfirmation) showSaveConfirmation(`Download started: ${filename}`);
    } catch (e) { console.error("Error exporting notes:", e); showSaveConfirmation("Error exporting notes!", true); }
}

// --- FULLY CORRECTED importNotes Function ---
function importNotes(file) {
    if (!file || file.type !== "application/json") {
        alert("Please select a valid JSON file (.json).");
        return;
    }
    const reader = new FileReader();

    // Make the onload function asynchronous to use await
    reader.onload = async (e) => {
        let importedNotes = null;
        try {
            // Parse the file content
            importedNotes = JSON.parse(e.target.result);

            // **Validation:** Ensure it's an array of objects
            if (!Array.isArray(importedNotes)) {
                throw new Error('File does not contain a valid JSON array of notes.');
            }
            if (!importedNotes.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                 throw new Error('File contains items that are not valid note objects.');
            }
            // Optional: Add more checks here later (e.g., check for expected properties like 'id', 'title')

            // Determine selected import mode
            const selectedModeRadio = document.querySelector('#importExportModal input[name="importMode"]:checked');
            const importMode = selectedModeRadio ? selectedModeRadio.value : 'replace'; // Default to 'replace'

            // Set confirmation message based on mode
            let confirmationMessage = '';
            if (importMode === 'append') {
                confirmationMessage = `Append ${importedNotes.length} note(s) to your existing ${appState.notes.length} notes?`;
            } else { // 'replace' mode
                confirmationMessage = `REPLACE all your current ${appState.notes.length} notes with the ${importedNotes.length} imported note(s)? This cannot be undone.`;
            }

            // Show confirmation dialog
            if (confirm(confirmationMessage)) {

                // --- Handle based on mode ---
                if (importMode === 'append') {
                    console.log(`Attempting to append ${importedNotes.length} notes via backend.`);
                    try {
                        const response = await fetch(`${API_BASE_URL}/notes/append`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(importedNotes) // Send notes to append
                        });

                        const data = await response.json(); // Try parsing response body

                        if (!response.ok) {
                             throw new Error(`HTTP error! status: ${response.status} - ${data.message || 'Append failed on server'}`);
                        }

                        console.log('Backend append successful:', data);
                        // IMPORTANT: Re-fetch notes to get the complete updated list
                        fetchNotesAndFinalize(); // Fetches and re-renders everything
                        showSaveConfirmation(`Successfully appended ${data.added || 0} notes.`);

                        // Reset UI elements
                        if (importFileInput) importFileInput.value = '';
                        if (importNotesBtn) { importNotesBtn.disabled = true; importNotesBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
                        if (importExportModal) importExportModal.classList.add('hidden');
                        document.body.style.overflow = '';

                    } catch (error) {
                        console.error('Error appending notes via backend:', error);
                        alert(`Error appending notes: ${error.message}`);
                        // Don't close modal on error, let user retry or close manually
                    }

                } else { // Mode is 'replace'
                    console.log(`Attempting to replace notes with ${importedNotes.length} imported notes.`);

                    // 1. Update the notes array WITHIN appState directly
                    appState.notes = importedNotes;
                    // Note: appState.tabs remains unchanged as import format is just notes array

                    // 2. Call saveNotesToBackend to send the *entire updated appState*
                    try {
                        await saveNotesToBackend(appState); // Use await and the correct function

                        console.log("Imported notes saved to backend (Replace mode).");
                        // 3. Update UI based on the NEW appState.notes
                        renderNotes();
                        updateNoteCount();
                        checkEmptyState();
                        showSaveConfirmation(`Successfully replaced notes with ${appState.notes.length} imported notes.`);

                        // 4. Reset UI elements
                        if (importFileInput) importFileInput.value = '';
                        if (importNotesBtn) { importNotesBtn.disabled = true; importNotesBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
                        if (importExportModal) importExportModal.classList.add('hidden');
                        document.body.style.overflow = '';

                    } catch (error) {
                        // Error saving to backend (alert is shown by saveNotesToBackend)
                        console.error("Error saving imported notes during replace:", error);
                        // Alert is handled by saveNotesToBackend.
                        // UI might be inconsistent. User may need to refresh manually.
                        // Reset UI elements even on failure
                        if (importFileInput) importFileInput.value = '';
                        if (importNotesBtn) { importNotesBtn.disabled = true; importNotesBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
                        if (importExportModal) importExportModal.classList.add('hidden');
                        document.body.style.overflow = '';
                    }
                } // End of replace mode logic
            } else {
                console.log("Import cancelled by user.");
                // Reset file input state if cancelled after selection
                if (importFileInput) importFileInput.value = '';
                if (importNotesBtn) { importNotesBtn.disabled = true; importNotesBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
            }
        } catch (error) { // Catch errors from JSON.parse or validation
            console.error('Import error (parsing file or initial processing):', error);
            alert(`Error importing notes: ${error.message}`);
            // Reset file input state on error
             if (importFileInput) importFileInput.value = '';
             if (importNotesBtn) { importNotesBtn.disabled = true; importNotesBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
             // Keep modal open? Or close? For now, keep open.
        }
    }; // End of reader.onload

    reader.onerror = (e) => {
         console.error("File read error:", e);
         alert("Error reading the selected file.");
          // Reset file input state on error
         if (importFileInput) importFileInput.value = '';
         if (importNotesBtn) { importNotesBtn.disabled = true; importNotesBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
    };

    reader.readAsText(file); // Start reading the file
} // End of importNotes function
// --- END OF CORRECTED Function ---

// ========== DRAG AND DROP FUNCTIONS ==========
function handleDragStart(e) { 
    dragSrcEl = this; 
    e.dataTransfer.effectAllowed = 'move'; 
    e.dataTransfer.setData('text/plain', 'note-' + this.dataset.id); // Add 'note-' prefix
    this.classList.add('dragging', 'opacity-50'); 
    console.log(`Drag started for note: ${this.dataset.id}`);
}
function handleDragOver(e) { /* ... Existing code ... */ if (e.preventDefault) e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }
function handleDragEnter(e) { /* ... Existing code ... */ if (this !== dragSrcEl) this.classList.add('dropzone', 'bg-blue-100'); }
function handleDragLeave(e) { /* ... Existing code ... */ this.classList.remove('dropzone', 'bg-blue-100'); }

// --- CORRECTED handleDrop function ---
function handleDrop(e) {
    // Prevent default drag behavior and event bubbling
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();

    // Ensure we are dropping onto a different note than the one being dragged
    if (dragSrcEl !== this) {
        const sourceId = dragSrcEl.dataset.id; // Get ID of the dragged note
        const targetId = this.dataset.id; // Get ID of the note being dropped onto
        
        // Extract the actual note ID if it has the "note-" prefix
        const draggedData = e.dataTransfer.getData('text/plain');
        const actualSourceId = draggedData.startsWith('note-') ? draggedData.replace('note-', '') : sourceId;
        
        console.log(`Note drop - draggedData: ${draggedData}, actualSourceId: ${actualSourceId}, targetId: ${targetId}`);

        // Find the current index of both notes in our appState.notes array
        const sourceIndex = appState.notes.findIndex(n => n.id === actualSourceId);
        const targetIndex = appState.notes.findIndex(n => n.id === targetId);
        
        console.log(`Note indices - sourceIndex: ${sourceIndex}, targetIndex: ${targetIndex}`);

        // Proceed only if both notes were found
        if (sourceIndex !== -1 && targetIndex !== -1) {
            // Save state snapshot before making changes
            const sourceNote = appState.notes[sourceIndex];
            saveStateSnapshot(`Reorder note "${sourceNote.title}"`);

            // --- Array Manipulation Logic ---
            // 1. Create a *copy* of the current notes array from appState
            let updatedNotes = [...appState.notes];

            // 2. Remove the dragged note from the copied array
            //    splice returns an array containing the removed elements, so we take the first ([0])
            const [removedNote] = updatedNotes.splice(sourceIndex, 1);

            // 3. Insert the removed note at the target index in the copied array
            updatedNotes.splice(targetIndex, 0, removedNote);

            // --- Update State & UI ---
            // 4. Update the actual appState.notes with the reordered array
            appState.notes = updatedNotes;

            // 5. Re-render the notes grid immediately based on the new order in appState.notes
            //    This provides an "optimistic update" - the user sees the change instantly.
            renderNotes();

            // --- Sync with Backend ---
            // 6. Save the entire appState (which includes the reordered notes array) to the backend.
            saveNotesToBackend()
                .then(() => {
                    // Log success if the backend confirms the save
                    console.log(`Drag/Drop order saved to backend successfully.`);
                })
                .catch(error => {
                    // Log an error if the backend save fails
                    console.error("Backend save failed after drag/drop, UI might be out of sync.", error);
                    // Optional: Alert the user or attempt to revert the UI change here
                    // alert("Error: Could not save the new note order to the server.");
                });

        } else {
            // Log an error if we couldn't find the source or target note index
            console.error("Drag/Drop Error: Could not find source or target index. SourceID:", sourceId, "TargetID:", targetId);
        }
    } // End if (dragSrcEl !== this)

    // Clean up dropzone styling from the target element
    this.classList.remove('dropzone', 'bg-blue-100');
    return false; // Indicate drop was handled
} // --- End of CORRECTED handleDrop function ---

function handleDragEnd(e) { /* ... Existing code ... */ this.classList.remove('dragging', 'opacity-50'); document.querySelectorAll('.sticky-note').forEach(noteEl => noteEl.classList.remove('dropzone', 'bg-blue-100')); dragSrcEl = null; }

// ... (Rest of the script) ...

// ========== THEME FUNCTIONS ==========
function toggleTheme() { /* ... */ document.body.classList.toggle('dark'); const isDark = document.body.classList.contains('dark'); const icon = themeToggle.querySelector('i'); if(icon) icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'}`; localStorage.setItem('theme', isDark ? 'dark' : 'light'); console.log(`Theme changed to: ${isDark ? 'dark' : 'light'}`); }
function loadThemePreference() { /* ... */ const savedTheme = localStorage.getItem('theme'); if (savedTheme === 'dark') { document.body.classList.add('dark'); const icon = themeToggle.querySelector('i'); if (icon) icon.className = 'fas fa-sun'; console.log("Applied dark theme."); } else { console.log("Using light theme."); } }

// ========== UNDO SYSTEM FUNCTIONS ==========
function saveStateSnapshot(actionDescription = 'Unknown action') {
    // Create a deep copy of the current app state
    const stateSnapshot = {
        appState: JSON.parse(JSON.stringify(appState)),
        timestamp: new Date().toISOString(),
        action: actionDescription
    };
    
    // Add to history (keep only recent actions)
    undoHistory.push(stateSnapshot);
    if (undoHistory.length > MAX_UNDO_HISTORY) {
        undoHistory.shift(); // Remove oldest
    }
    
    // Update undo button state
    updateUndoButtonState();
    
    console.log(`State snapshot saved: ${actionDescription} (${undoHistory.length} in history)`);
    console.log(`Notes in snapshot: ${stateSnapshot.appState.notes?.length || 0}`);
}

function performUndo() {
    if (undoHistory.length === 0) {
        console.log('No actions to undo');
        return;
    }
    
    const lastSnapshot = undoHistory.pop();
    console.log(`Undoing: ${lastSnapshot.action}`);
    console.log(`Restoring ${lastSnapshot.appState.notes?.length || 0} notes`);
    
    // Restore the previous state
    appState = lastSnapshot.appState;
    
    // Update UI to reflect restored state
    renderCourses();
    renderNotes();
    highlightActiveCourse();
    
    // Save to backend
    saveNotesToBackend().catch(error => {
        console.error('Failed to save undo state to backend:', error);
        showConfirmationMessage('Undo applied but failed to save to server');
    });
    
    // Update undo button state
    updateUndoButtonState();
    
    // Show confirmation
    showConfirmationMessage(`Undid: ${lastSnapshot.action}`);
}

function updateUndoButtonState() {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        const canUndo = undoHistory.length > 0;
        undoBtn.disabled = !canUndo;
        
        if (canUndo) {
            const lastAction = undoHistory[undoHistory.length - 1].action;
            undoBtn.title = `Undo: ${lastAction} (Ctrl+Z)`;
        } else {
            undoBtn.title = 'No actions to undo';
        }
    }
}

// ========== UTILITY FUNCTIONS ==========
function showConfirmationMessage(message) {
    const confirmationDiv = document.getElementById('confirmationMessage');
    if (confirmationDiv) {
        confirmationDiv.textContent = message;
        confirmationDiv.classList.remove('opacity-0');
        confirmationDiv.classList.add('opacity-100');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            confirmationDiv.classList.remove('opacity-100');
            confirmationDiv.classList.add('opacity-0');
        }, 3000);
    }
    console.log('Confirmation:', message);
}

function formatDate(dateInput, format = 'display') { /* ... */ try { const d=new Date(dateInput); if(isNaN(d.getTime())) return "?"; return format==='file'?`${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`:d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}); } catch(e){ return "?"; } }
function formatTime(dateInput) { /* ... */ try { const d=new Date(dateInput); if(isNaN(d.getTime())) return "?"; return d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',hour12:true}); } catch(e){ return "?"; } }
function formatDateTime(dateInput) { /* ... */ try { const d=new Date(dateInput); if(isNaN(d.getTime())) return "?"; return d.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}); } catch(e){ return "?"; } }
function formatDateTimeLocal(date) { /* ... */ if(!(date instanceof Date)||isNaN(date.getTime())) return ''; try { const o=date.getTimezoneOffset()*60000; const l=new Date(date.getTime()-o); return l.toISOString().slice(0,16); } catch(e){ return ''; } }
function formatDateOnly(date) { /* ... */ if(!(date instanceof Date)||isNaN(date.getTime())) return ''; try { return date.toISOString().slice(0,10); } catch(e){ return ''; } }

console.log("Sticky Notes App script loaded successfully! (V5 - Backend Integration)");
// ========== END OF SCRIPT ==========
