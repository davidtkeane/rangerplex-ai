/**
 * @file middleware.js
 * @description Configures and exports various Express middleware functions.
 *
 * What it is:
 * This module centralizes the setup for common middleware used throughout the
 * Express application. This includes CORS handling, request body parsing,
 * session management, static file serving, file uploads (Multer), and
 * authentication checks.
 *
 * Why we use it:
 * - Keeps middleware configuration separate from the main server setup (`server.js`)
 * and route definitions.
 * - Makes middleware configurations reusable and easier to manage.
 * - Improves the readability of `server.js`.
 *
 * Links:
 * - Imported by: `server.js` (to apply middleware globally or to specific routes).
 * - Uses: `express`, `cors`, `express-session`, `connect-sqlite3`, `multer`, `path`.
 * - Reads configuration: `config` object from `./config.js`.
 * - Uses: `logger` from `./logging.js`.
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const multer = require('multer');
const path = require('path');
const config = require('./config'); // Import centralized configuration
const logger = require('./logging'); // Import logger

// --- CORS Middleware ---
// What it is: Configures Cross-Origin Resource Sharing.
// Why we use it: Allows requests from the specified frontend origin(s) (e.g., http://localhost:8080)
//              to access the backend API, while blocking requests from other unknown origins
//              in a browser context. Essential for decoupling frontend and backend.
// Links: Uses `config.frontendUrl`. Applied globally in `server.js`.
const corsOptions = {
  origin: function (origin, callback) {
    // Allowlist includes the configured frontend URL and common local dev origins
    const allowedOrigins = [
      config.frontendUrl, // From .env or default
      'http://localhost:8080', // Common dev server
      'http://localhost:5500', // Common Live Server
      'http://127.0.0.1:5500', // Live Server Alt IP
      'http://127.0.0.1:8080', // Alt dev server IP
      undefined // Allow requests with no origin (like Postman, curl, server-to-server)
    ];
    // Allow any localhost origin for flexibility during development
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      logger.debug(`CORS allowed for origin: ${origin || 'No Origin (e.g., Postman)'}`);
      callback(null, true); // Allow
    } else {
      logger.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS')); // Block
    }
  },
  credentials: true // Important: Allows frontend to send/receive cookies (like session ID)
};
const corsMiddleware = cors(corsOptions);

// --- Body Parsing Middleware ---
// What it is: Parses incoming request bodies.
// Why we use it: Makes request data (JSON, URL-encoded forms) available on `req.body`.
// Links: Applied globally in `server.js`.
const jsonParser = express.json(); // Parses JSON bodies
const urlencodedParser = express.urlencoded({ extended: true }); // Parses URL-encoded bodies

// --- Session Middleware ---
// What it is: Configures session management using cookies and a server-side store.
// Why we use it: Tracks logged-in users across multiple requests. Stores session data
//              in the SQLite database using `connect-sqlite3`.
// Links: Uses `config.sessionSecret`, `config.nodeEnv`, `config.db.filename`. Applied globally in `server.js`.
const sessionMiddleware = session({
  // Store sessions in the SQLite database file
  store: new SQLiteStore({
      db: config.db.filename, // Filename from config
      table: 'sessions',      // Table name for sessions
      dir: path.dirname(config.db.path) // Directory containing the DB file (project root)
  }),
  secret: config.sessionSecret, // Secret used to sign the session ID cookie
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie expiry time: 7 days
    httpOnly: true, // Prevents client-side JS from reading the cookie (security)
    secure: config.nodeEnv === 'production', // Send cookie only over HTTPS in production
    sameSite: 'lax' // Protects against some CSRF attacks
  }
});

// --- Static File Serving Middleware ---
// What it is: Serves files from a specified directory.
// Why we use it: Allows the browser to directly request files like uploaded avatars.
// Links: Uses `config.uploads.dir`. Applied globally in `server.js` for the '/uploads' path.
const staticUploadsMiddleware = express.static(config.uploads.dir);

// --- Multer Middleware (File Uploads) ---
// What it is: Configures Multer for handling multipart/form-data, primarily for file uploads.
// Why we use it: Specifically needed for parsing the avatar upload form submission.
// Links: Uses `config.uploads.avatars`. Used specifically on the avatar upload route.

// 1. Storage Configuration: Defines where and how files are saved.
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploads.avatars), // Use avatars path from config
  filename: (req, file, cb) => {
    // Generate a unique filename: user_<id>_<timestamp>-<random>.<ext>
    const userId = req.session?.user?.id || 'unknown'; // Include user ID if available in session
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `user_${userId}_${uniqueSuffix}${extension}`;
    logger.debug(`Multer generating filename: ${filename}`);
    cb(null, filename);
  }
});

// 2. File Filter: Defines which file types are accepted.
const avatarFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    logger.debug(`Multer allowing file: ${file.originalname} (type: ${file.mimetype})`);
    cb(null, true); // Accept image file
  } else {
    logger.warn(`Multer rejecting file: ${file.originalname} (type: ${file.mimetype}) - Not an image.`);
    // Reject file with a specific error message Multer can catch
    cb(new Error('Not an image! Please upload an image file (JPG, PNG, GIF).'), false);
  }
};

// 3. Multer Instance: Combines storage, filter, and limits.
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});
// Note: We export `uploadAvatar` itself, not just middleware using it yet.
// The route handler will use `uploadAvatar.single('avatar')`.

// --- Authentication Middleware ---
// What it is: Checks if a user is logged in by verifying session data.
// Why we use it: Protects routes that should only be accessible to authenticated users.
// Links: Applied to specific routes (e.g., profile routes) in `server.js` or route files. Uses `logger`.
const isAuthenticated = (req, res, next) => {
  // Log session details for debugging authentication issues
  logger.debug(`[Auth Check] Path: ${req.path}, Method: ${req.method}, SessionID: ${req.sessionID}`);
  logger.debug(`[Auth Check] Session Exists: ${!!req.session}, Session User: ${JSON.stringify(req.session?.user)}`);

  // Check if session exists and contains valid user ID
  if (req.session?.user?.id) {
    logger.debug(`[Auth Check] Success for User ID: ${req.session.user.id}`);
    next(); // User is authenticated, proceed to the next middleware or route handler
  } else {
    logger.warn(`[Auth Check] Failed. Session or user data missing.`);
    // Respond with 401 Unauthorized if not authenticated
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
};


// --- Export Middleware ---
// What it is: Makes the configured middleware functions/instances available for import.
// Why we use it: Allows `server.js` to easily import and apply these configurations.
module.exports = {
  cors: corsMiddleware,
  jsonParser,
  urlencodedParser,
  session: sessionMiddleware,
  staticUploads: staticUploadsMiddleware, // Middleware for serving /uploads
  uploadAvatar, // The configured Multer instance (use .single()/.array() in routes)
  isAuthenticated // The authentication check function
};

logger.info('Middleware configurations loaded.');