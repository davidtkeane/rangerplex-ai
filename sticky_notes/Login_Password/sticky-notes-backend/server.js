/**
 * @file server.js
 * @description Main entry point for the Secure Portal backend application.
 * Now also serves static frontend files from the 'public' directory.
 */

const express = require('express');
const path = require('path'); // Import path module

// --- Load Core Modules ---
const config = require('./src/config');
const logger = require('./src/logging');
const db = require('./src/db');
const middleware = require('./src/middleware');
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profile');

logger.info('Starting Secure Portal API server setup...');

// --- Create Express App ---
const app = express();

// --- Apply Global Middleware ---
logger.info('Applying global middleware...');
// 1. CORS: Still useful for flexibility, though less critical now
app.use(middleware.cors);
// 2. Body Parsers
app.use(middleware.jsonParser);
app.use(middleware.urlencodedParser);
// 3. Session
app.use(middleware.session);
// 4. Static Files for Uploads (Avatars, etc.)
// Serve files from '/uploads' directory mapped to the '/uploads' URL path
app.use('/uploads', middleware.staticUploads);

// 5. <<<< NEW: Static Files for Frontend >>>>
// Serve static files (HTML, CSS, JS) from the 'public' directory
// This should come *before* API routes if your frontend uses client-side routing
// that might overlap with API paths, but after essential middleware like sessions.
const publicDirectoryPath = path.join(__dirname, 'public');
logger.info(`Serving static frontend files from: ${publicDirectoryPath}`);
app.use(express.static(publicDirectoryPath));
// <<<< END NEW >>>>

logger.info('Global middleware applied.');

// --- Define Root Route (Optional - Can be handled by index.html now) ---
// You might remove this or keep it for a basic API check endpoint
app.get('/api-check', (req, res) => { // Changed path to avoid conflict with index.html
    logger.debug(`[Route /api-check] Request received. SessionID: ${req.sessionID}`);
    res.status(200).json({
        message: 'Secure Portal API is running! (Refactored + Static Serving)',
        sessionID: req.sessionID,
        user: req.session?.user || 'Not logged in',
        databaseStatus: db ? 'Connected' : 'Error',
        emailServiceConfigured: config.email.enabled,
        nodeEnv: config.nodeEnv
    });
});

// --- Mount API Routers ---
// These need to be mounted *after* the general static file handler
// if there's any chance of path overlap (e.g., frontend routing)
// but it's usually fine like this if API paths are distinct (like /api/...).
logger.info('Mounting API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
logger.info('API routes mounted: /api/auth, /api/profile');

// --- Optional: Redirect root path to login page ---
// If someone visits http://localhost:3000/, redirect them to the login page.
app.get('/', (req, res) => {
    res.redirect('/public/index.html');
});


// --- Basic Error Handling Middleware ---
// (Code remains the same - Omitted for brevity)
app.use((err, req, res, next) => {
    logger.error('Unhandled error caught by final error handler:', { error: err, path: req.path, method: req.method });
    const errorResponse = { error: 'An unexpected internal server error occurred.' };
    if (config.nodeEnv !== 'production') { errorResponse.details = err.message; errorResponse.stack = err.stack; }
    res.status(err.status || 500).json(errorResponse);
});

// --- Not Found Handler ---
// This will now catch requests that aren't static files or defined API routes.
// (Code remains the same - Omitted for brevity)
app.use((req, res, next) => {
    logger.warn(`[404 Not Found] Path: ${req.path}, Method: ${req.method}`);
    // Send a JSON 404 for API-like paths, or consider sending a custom HTML 404 page
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
    } else {
        // Optionally send a user-friendly 404 HTML page
        res.status(404).sendFile(path.join(publicDirectoryPath, '404.html')); // Create a 404.html in public if desired
        // Or just send text:
        // res.status(404).send('Page not found');
    }
});


// --- Start Server ---
// (Code remains the same - Omitted for brevity)
const server = app.listen(config.port, () => {
  logger.info(`Server successfully started and listening on http://localhost:${config.port}`);
  logger.info(`Frontend files served from 'public' directory.`);
  // ... other logs ...
});

// --- Graceful Shutdown ---
// (Code remains the same - Omitted for brevity)
process.on('SIGINT', () => { /* ... close server and db ... */
  logger.warn('SIGINT signal received: Closing HTTP server and database connection...');
  server.close(() => {
      logger.info('HTTP server closed.');
      db.close((err) => {
        if (err) { logger.error("Error closing the SQLite database connection:", { error: err }); process.exit(1); }
        else { logger.info('SQLite database connection closed successfully.'); process.exit(0); }
      });
  });
});
process.on('SIGTERM', () => { logger.warn('SIGTERM signal received: Initiating graceful shutdown...'); process.emit('SIGINT'); });

