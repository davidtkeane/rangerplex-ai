// ----- Backend Server (server.js - Corrected Scopes) -----

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

console.log('--- Server script starting ---');

const app = express();
const PORT = 3002;  // Moved from 3001 to avoid Media Server conflict
const DATA_FILE = path.join(__dirname, 'json', 'active.json');

// --- State for SSE Clients ---
// MOVED TO TOP LEVEL: Define sseClients array here so it's accessible by all functions/routes
let sseClients = []; // Initialize empty array globally within this module

// --- Helper Functions ---

// MOVED TO TOP LEVEL: Define sendSseUpdate function here BEFORE routes that call it
function sendSseUpdate() {
  console.log(`Sending SSE update to ${sseClients.length} clients.`);
  sseClients.forEach(client => {
    // Check if response object is still writable (basic check)
    if (!client.res.writableEnded) {
        client.res.write('event: notes_updated\n');
        client.res.write('data: refresh\n\n');
    } else {
         console.warn(`Attempted to write to closed SSE client: ${client.id}`);
         // Consider removing the client here if detected as closed, though req.on('close') is primary cleanup
    }
  });
}

async function readNotesFromFile() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const fileContent = JSON.parse(data);

    // Check if data is in old array format
    if (Array.isArray(fileContent)) {
      console.warn('Data file in old format (array). Converting to {tabs, notes}');
      return { tabs: [], notes: fileContent };
    }

    // Check for new format structure
    if (typeof fileContent === 'object' && fileContent !== null && Array.isArray(fileContent.notes)) {
      if (!Array.isArray(fileContent.tabs)) {
        console.warn("Adding missing tabs array to data structure");
        fileContent.tabs = [];
      }
      return fileContent;
    }

    console.error('Invalid data format - using empty structure');
    return { tabs: [], notes: [] };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { tabs: [], notes: [] };
    } else if (error instanceof SyntaxError) {
      console.error('JSON parse error:', error);
      return { tabs: [], notes: [] };
    }
    throw error;
  }
}

async function writeNotesToFile(dataObject) {
  // Validate data structure - support both tabs and courses format
  if (typeof dataObject !== 'object' || dataObject === null || 
      !Array.isArray(dataObject.notes) || 
      (!Array.isArray(dataObject.tabs) && !Array.isArray(dataObject.courses))) {
    console.error('Invalid data structure:', dataObject);
    throw new Error("Invalid data: Object with 'notes' and 'tabs' or 'courses' arrays expected.");
  }

  // Convert courses back to tabs for file storage if needed
  let dataToSave = { ...dataObject };
  if (dataObject.courses && !dataObject.tabs) {
    dataToSave.tabs = dataObject.courses;
    delete dataToSave.courses;
  }

  const dataToWrite = JSON.stringify(dataToSave, null, 2);
  await fs.writeFile(DATA_FILE, dataToWrite, 'utf8');
  
  const tabsOrCourses = dataToSave.tabs || dataObject.courses || [];
  console.log(`Saved data: ${dataObject.notes.length} notes, ${tabsOrCourses.length} tabs/courses`);
  sendSseUpdate();
}

// --- Middleware ---
console.log('Attempting to apply CORS middleware...');
app.use(cors());
console.log('CORS middleware APPLIED.');

console.log('Attempting to apply express.json middleware...');
app.use(express.json());
console.log('express.json middleware APPLIED.');


// --- API Routes ---
// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));
// console.log('Serving static files from:', path.join(__dirname, 'public')); // Optional: for debugging

// GET /api/notes
app.get('/api/notes', async (req, res) => {
  console.log('GET /api/notes requested');
  try {
    const notes = await readNotesFromFile(); // Use helper
    res.json(notes);
  } catch (error) {
    console.error('Error reading notes file for GET:', error);
    res.status(500).json({ message: 'Error reading notes data' });
  }
});

// POST /api/notes (Overwrite)
app.post('/api/notes', async (req, res) => {
  console.log('POST /api/notes requested (overwrite)');
  try {
    const dataFromFrontend = req.body;
    // Validate new data structure (backwards compatible with tabs/courses)
    if (typeof dataFromFrontend !== 'object' || dataFromFrontend === null ||
        !Array.isArray(dataFromFrontend.notes) || 
        (!Array.isArray(dataFromFrontend.courses) && !Array.isArray(dataFromFrontend.tabs))) {
      return res.status(400).json({ message: 'Invalid data format: Object with notes and courses/tabs arrays expected.' });
    }
    
    // Ensure we have tabs for writeNotesToFile (which expects tabs)
    let dataToSave = { ...dataFromFrontend };
    
    if (dataFromFrontend.courses && !dataFromFrontend.tabs) {
      // Convert courses to tabs for file storage
      dataToSave.tabs = dataFromFrontend.courses.map(course => ({
        id: course.id,
        name: course.name,
        color: course.color || '#3b82f6',
        semester: course.semester || 'Current',
        instructor: course.instructor || ''
      }));
      delete dataToSave.courses;
    } else if (dataFromFrontend.tabs) {
      // Frontend already sent tabs - use them directly
      dataToSave.tabs = dataFromFrontend.tabs;
    }
    
    await writeNotesToFile(dataToSave);
    // sendSseUpdate(); // <<< REMOVE call from here
    res.json({ message: 'Notes saved successfully (overwritten)' });
  } catch (error) {
    console.error('Error processing POST /api/notes:', error);
    res.status(500).json({ message: 'Error saving notes data' });
  }
});

// POST /api/notes/add (Add single note)
app.post('/api/notes/add', async (req, res) => {
  console.log('POST /api/notes/add requested');
  try {
    const newNoteData = req.body;
    // Validate note structure
    if (typeof newNoteData !== 'object' || newNoteData === null || Array.isArray(newNoteData)) {
      return res.status(400).json({ message: 'Invalid note data format: Object expected' });
    }
    if (!newNoteData.title?.trim() && !newNoteData.content?.trim()) {
      return res.status(400).json({ message: 'Note requires at least title or content' });
    }

    const existingData = await readNotesFromFile();
    const now = new Date().toISOString();
    const noteToAdd = {
      id: uuidv4(),
      title: newNoteData.title?.trim() || 'Untitled',
      content: newNoteData.content?.trim() || '',
      color: newNoteData.color || '#fff3cd',
      reminder: newNoteData.reminder || null,
      pinned: newNoteData.pinned || false,
      createdAt: now,
      updatedAt: now,
      tabId: newNoteData.tabId || null,  // Add tab association
      todoItems: newNoteData.todoItems || null,  // Add todo items support
      dueDate: newNoteData.dueDate || null,  // Add due date support
      priority: newNoteData.priority || 'medium'  // Add priority support (default: medium)
    };
    
    existingData.notes.unshift(noteToAdd);

    await writeNotesToFile(existingData);
    // sendSseUpdate(); // <<< REMOVE call from here

    res.status(201).json(noteToAdd); // Send back the created note

  } catch (error) {
    console.error('Error processing POST /api/notes/add:', error);
    res.status(500).json({ message: 'Error adding new note' });
  }
});

// POST /api/notes/append (Append an array of notes)
app.post('/api/notes/append', async (req, res) => {
  console.log('POST /api/notes/append requested');
  try {
    const notesToAppend = req.body;
    
    // --- Validation ---
    if (!Array.isArray(notesToAppend)) {
      console.warn('Append request received non-array data:', notesToAppend);
      return res.status(400).json({ message: 'Invalid data format: Array expected.' });
    }
    if (notesToAppend.length === 0) {
      return res.status(200).json({ message: 'Received empty array, no notes appended.', count: 0 });
    }

    const existingData = await readNotesFromFile();
    let addedCount = 0;
    let duplicateCount = 0;

    // --- Process Each Note ---
    for (const note of notesToAppend) {
      // Validate basic note structure
      if (typeof note !== 'object' || note === null || Array.isArray(note)) {
        console.warn('Skipping invalid note format:', note);
        continue;
      }

      // Ensure required fields
      const processedNote = {
        id: note.id || uuidv4(),
        title: note.title?.trim() || 'Untitled',
        content: note.content?.trim() || '',
        color: note.color || '#fff3cd',
        reminder: note.reminder || null,
        pinned: note.pinned || false,
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tabId: note.tabId || null,
        todoItems: note.todoItems || null,  // Add todo items support
        dueDate: note.dueDate || null,  // Add due date support
        priority: note.priority || 'medium'  // Add priority support
      };

      // Check for duplicate ID
      if (existingData.notes.some(n => n.id === processedNote.id)) {
        console.warn(`Duplicate ID found: ${processedNote.id}`);
        duplicateCount++;
        continue;
      }

      existingData.notes.push(processedNote);
      addedCount++;
    }

    console.log(`Processed ${notesToAppend.length} notes: Added ${addedCount}, Skipped ${duplicateCount}`);

    // --- Write Updated Data ---
    await writeNotesToFile(existingData);

    // --- Send Response ---
    res.status(200).json({
      message: 'Notes processing complete',
      totalReceived: notesToAppend.length,
      added: addedCount,
      duplicatesSkipped: duplicateCount
    });

  } catch (error) {
    // Handle potential errors during file read/write or other issues
    console.error('Error processing POST /api/notes/append:', error);
    // Check if it's a validation error we threw or a server error
    if (error.message.includes("Invalid data")) {
         res.status(400).json({ message: error.message }); // Bad Request
    } else {
         res.status(500).json({ message: 'Error appending notes data on server' }); // Internal Server Error
    }
  }
}); // End of POST /api/notes/append

// --- API Routes ---

// ... (Keep existing GET /api/notes, POST /api/notes, POST /api/notes/add, POST /api/notes/append) ...


// ========== TAB API ROUTES ==========

// POST /api/tabs - Create a new tab
app.post('/api/tabs', async (req, res) => {
    console.log('POST /api/tabs requested (create tab)');
    try {
        const { name } = req.body; // Get the 'name' property from the request body

        // --- Validation ---
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            console.warn('Create tab request failed: Invalid or missing name.');
            // 400 Bad Request - client sent invalid data
            return res.status(400).json({ message: 'Invalid request: Tab name is required and cannot be empty.' });
        }

        const trimmedName = name.trim(); // Use the trimmed name

        // --- Read Existing Data ---
        const existingData = await readNotesFromFile();

        // --- Check for Duplicate Name (Optional but recommended) ---
        if (existingData.tabs.some(tab => tab.name.toLowerCase() === trimmedName.toLowerCase())) {
             console.warn(`Create tab request failed: Duplicate name "${trimmedName}"`);
             // 409 Conflict - The request could not be completed due to a conflict with the current state of the resource.
             return res.status(409).json({ message: `A tab with the name "${trimmedName}" already exists.` });
        }

        // --- Create New Tab Object ---
        const newTab = {
            id: uuidv4(),       // Generate a unique ID
            name: trimmedName   // Use the validated & trimmed name
            // Add any other default properties for tabs if needed in the future
        };

        // --- Add to Data and Write ---
        existingData.tabs.push(newTab); // Add the new tab to the tabs array
        await writeNotesToFile(existingData); // Save the entire updated structure

        // --- Success Response ---
        console.log(`Successfully created tab: ID=${newTab.id}, Name="${newTab.name}"`);
        // 201 Created - Resource successfully created
        res.status(201).json(newTab); // Send back the newly created tab object

    } catch (error) {
        // Handle potential errors during file read/write or other issues
        console.error('Error processing POST /api/tabs:', error);
        // 500 Internal Server Error - Something went wrong on the server side
        res.status(500).json({ message: 'Error creating new tab on server.' });
    }
}); // End of POST /api/tabs

// POST /api/courses - Create a new course
app.post('/api/courses', async (req, res) => {
    console.log('POST /api/courses requested (create course)');
    try {
        const { name, color, semester, instructor } = req.body;
        
        // --- Validation ---
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            console.warn('Create course request failed: Invalid or missing name.');
            return res.status(400).json({ message: 'Invalid request: Course name is required and cannot be empty.' });
        }
        
        const trimmedName = name.trim();
        
        // --- Read Existing Data ---
        const existingData = await readNotesFromFile();
        
        // Ensure courses array exists (backwards compatibility)
        if (!existingData.courses) {
            existingData.courses = existingData.tabs ? existingData.tabs.map(tab => ({
                ...tab,
                color: '#3b82f6',
                semester: 'Current',
                instructor: ''
            })) : [];
            delete existingData.tabs;
        }
        
        // --- Check for Duplicate Name ---
        if (existingData.courses.some(course => course.name.toLowerCase() === trimmedName.toLowerCase())) {
            console.warn(`Create course request failed: Duplicate name "${trimmedName}"`);
            return res.status(409).json({ message: `A course with the name "${trimmedName}" already exists.` });
        }
        
        // --- Create New Course Object ---
        const newCourse = {
            id: uuidv4(),
            name: trimmedName,
            color: color || '#3b82f6', // default blue
            semester: semester || 'Current',
            instructor: instructor || ''
        };
        
        // --- Add to Data and Write ---
        existingData.courses.push(newCourse);
        await writeNotesToFile(existingData);
        
        // --- Send Response ---
        console.log(`Course created successfully: ${newCourse.name} (ID: ${newCourse.id})`);
        res.status(201).json(newCourse); // 201 Created + return the created course
        
    } catch (error) {
        console.error('Error processing POST /api/courses:', error);
        res.status(500).json({ message: 'Error creating new course on server.' });
    }
}); // End of POST /api/courses


// POST /api/vlc-save-state - VLC State Persistence
app.post('/api/vlc-save-state', async (req, res) => {
  console.log('POST /api/vlc-save-state requested');
  try {
    const vlcState = req.body;
    
    // Save VLC state to file in 08-data directory
    const vlcStateFile = path.join(__dirname, '..', '..', '..', '08-data', 'vlc_state.json');
    const vlcStateData = JSON.stringify(vlcState, null, 2);
    
    await fs.writeFile(vlcStateFile, vlcStateData, 'utf8');
    console.log(`📁 VLC state saved to file: ${vlcState.vlc_session.current_playlist.total_tracks} tracks`);
    
    // Also save playlist to separate file with timestamp
    if (vlcState.vlc_session.current_playlist.tracks.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const playlistsDir = path.join(__dirname, '..', '..', '..', '08-data', 'vlc_playlists');
      const playlistFile = path.join(playlistsDir, `playlist_${timestamp}.json`);
      
      // File rotation: Keep only the most recent 10 playlist files  
      const dirFiles = await fs.readdir(playlistsDir);
      const playlistFiles = dirFiles
        .filter(file => file.startsWith('playlist_') && file.endsWith('.json'))
        .map(file => path.join(playlistsDir, file));
        
      if (playlistFiles.length >= 10) {
        // Get file stats and sort by modification time (oldest first)
        const filesWithStats = await Promise.all(
          playlistFiles.map(async file => ({
            path: file,
            mtime: (await fs.stat(file)).mtime
          }))
        );
        
        filesWithStats.sort((a, b) => a.mtime - b.mtime);
        
        // Delete oldest files to keep only 9 (so new file makes 10)
        const filesToDelete = filesWithStats.length - 9;
        for (let i = 0; i < filesToDelete; i++) {
          try {
            await fs.unlink(filesWithStats[i].path);
            console.log(`🗑️ Deleted old VLC playlist: ${path.basename(filesWithStats[i].path)}`);
          } catch (error) {
            // File might already be deleted, continue
          }
        }
      }
      
      await fs.writeFile(playlistFile, JSON.stringify({
        saved_at: vlcState.timestamp,
        tracks: vlcState.vlc_session.current_playlist.tracks,
        current_track: vlcState.vlc_session.current_playlist.current_track_index,
        settings: vlcState.vlc_session.settings
      }, null, 2), 'utf8');
      console.log(`💾 VLC playlist backup saved: playlist_${timestamp}.json`);
    }
    
    res.json({ 
      message: 'VLC state saved successfully',
      tracks: vlcState.vlc_session.current_playlist.total_tracks,
      file_saved: true
    });
  } catch (error) {
    console.error('Error saving VLC state:', error);
    res.status(500).json({ message: 'Error saving VLC state' });
  }
});

// GET /api/vlc-load-state - VLC State Loading
app.get('/api/vlc-load-state', async (req, res) => {
  console.log('GET /api/vlc-load-state requested');
  try {
    const vlcStateFile = path.join(__dirname, '..', '..', '..', '08-data', 'vlc_state.json');
    
    if (await fs.access(vlcStateFile).then(() => true).catch(() => false)) {
      const vlcStateData = await fs.readFile(vlcStateFile, 'utf8');
      const vlcState = JSON.parse(vlcStateData);
      
      console.log(`📁 VLC state loaded: ${vlcState.vlc_session.current_playlist.total_tracks} tracks`);
      res.json({ 
        success: true,
        vlc_state: vlcState,
        tracks: vlcState.vlc_session.current_playlist.total_tracks
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'No VLC state file found'
      });
    }
  } catch (error) {
    console.error('Error loading VLC state:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error loading VLC state'
    });
  }
});

// ... (Keep existing GET /api/events and other routes/server start logic) ...

// GET /api/events - SSE Endpoint
app.get('/api/events', (req, res) => {
  console.log('SSE client connected');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res: res };
  // Now uses the globally defined sseClients array
  sseClients.push(newClient);
  console.log(`Added SSE client: ${clientId}. Total clients: ${sseClients.length}`);

  // Optional: Send connected message
  // res.write(`event: connected\ndata: ${JSON.stringify({ clientId: clientId })}\n\n`);

  req.on('close', () => {
    console.log(`SSE client disconnected: ${clientId}`);
    // Uses the globally defined sseClients array
    sseClients = sseClients.filter(client => client.id !== clientId);
    console.log(`Removed SSE client. Total clients: ${sseClients.length}`);
    // Don't call res.end() here explicitly; the connection is already closed
  });
});

// --- Basic Homepage Route (Optional) ---
app.get('/', (req, res) => { res.send('Hello from Sticky Notes Backend!'); });

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`--- Server Setup Complete ---`);
  console.log(`Sticky Notes backend server running on http://localhost:${PORT}`);
});

