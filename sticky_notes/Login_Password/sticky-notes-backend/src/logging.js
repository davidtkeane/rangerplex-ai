/**
 * @file logging.js
 * @description Centralized logging configuration for the application using Winston.
 *
 * What it is:
 * This module sets up and configures the Winston logging library. Winston allows
 * for flexible logging to multiple destinations (called "transports") with
 * different formats and levels.
 *
 * Why we use it:
 * - Centralizes logging setup, making it consistent across the application.
 * - Replaces basic `console.log` with a more powerful system.
 * - Allows logging different message levels (info, warn, error).
 * - Enables logging to multiple outputs:
 * - Console: For easy viewing during development (with colors!).
 * - File (error.log): Captures only error messages and stack traces for debugging.
 * - File (activitylog.md): Captures all general activity (info level and above)
 * in a simple markdown format for auditing or reviewing flow.
 * - Provides structured logging (timestamps, levels, optional metadata).
 *
 * Links:
 * - Imported by: `server.js` (and eventually route files, middleware, etc.)
 * - Uses: `winston` library, Node.js `path` and `fs` modules.
 * - Writes to: `./logs/error.log` and `./logs/activitylog.md`
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Define the directory where log files will be stored.
const logDir = 'logs';

// --- Ensure Log Directory Exists ---
// What it is: Checks if the 'logs' directory exists at the project root.
// Why we use it: Log files need a place to be written. This prevents errors
//              if the directory hasn't been created manually.
// Links: Uses Node.js 'fs' (File System) module.
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir);
    console.log(`Log directory created at: ${path.resolve(logDir)}`); // Use console here as logger isn't ready yet
  } catch (err) {
    console.error(`Error creating log directory: ${logDir}`, err);
    // If we can't create the log dir, logging to files will fail.
    // Consider exiting or handling this more gracefully depending on requirements.
    process.exit(1);
  }
}

// --- Create Logger Instance ---
// What it is: Initializes the main Winston logger object.
// Why we use it: This is the core object we'll use throughout the app to log messages.
// Links: Configured with levels, formats, and transports below.
const logger = winston.createLogger({
  // --- Log Level ---
  // What it is: Specifies the minimum severity level to log.
  // Why we use it: Controls verbosity. 'info' means 'info', 'warn', and 'error' messages
  //              will be processed. 'debug' would be more verbose.
  level: process.env.LOG_LEVEL || 'info', // Default to 'info', allow override via .env

  // --- Default Log Format ---
  // What it is: Defines how log messages are structured in the output files (by default).
  // Why we use it: Ensures consistent and parseable log entries. JSON is common for files.
  // Links: Uses various winston.format methods.
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp
    winston.format.errors({ stack: true }), // Include stack traces for errors
    winston.format.splat(), // Enables string interpolation (e.g., logger.info('User %s logged in', userId))
    winston.format.json() // Log format as JSON for file transports initially
  ),

  // --- Default Metadata (Optional) ---
  // What it is: Adds common fields to every log entry.
  // Why we use it: Can help identify the source service in larger systems.
  defaultMeta: { service: 'secure-portal-api' },

  // --- Transports (Destinations) ---
  // What it is: Defines where the log messages should be sent.
  // Why we use it: Allows logging to multiple places simultaneously (files, console, etc.).
  transports: [
    // --- Error File Transport ---
    // What it is: Logs only 'error' level messages to 'error.log'.
    // Why we use it: Creates a dedicated file for quickly finding critical errors.
    // Links: Writes to './logs/error.log'. Uses a specific text format.
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error', // Only log errors here
      format: winston.format.combine( // Override default format for this file
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Custom text format for easier reading of errors
        winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message} ${info.metadata?.error?.stack ? '\n' + info.metadata.error.stack : info.stack ? '\n' + info.stack : ''}`)
      )
    }),

    // --- Activity File Transport ---
    // What it is: Logs all messages of level 'info' and above to 'activitylog.md'.
    // Why we use it: Provides a running log of general application activity in a human-readable format.
    // Links: Writes to './logs/activitylog.md'. Uses a simple markdown format.
    new winston.transports.File({
      filename: path.join(logDir, 'activitylog.md'),
      // level: 'info', // Implicitly uses the logger's main level ('info')
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Custom markdown-friendly format
        winston.format.printf(info => `* ${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
      )
    })
  ],

  // --- Exception Handling (Optional but Recommended) ---
  // What it is: Catches unhandled promise rejections and uncaught exceptions.
  // Why we use it: Ensures critical application crashes are logged before exit.
  // Links: Uses dedicated File transports for these specific crash logs.
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  ]
});

// --- Console Transport (Development Only) ---
// What it is: Adds logging to the console *only* when not in a 'production' environment.
// Why we use it: Provides immediate feedback during development without cluttering
//              production logs or relying solely on files. Uses colorization.
// Links: Uses NODE_ENV environment variable. Adds transport conditionally.
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(), // Add colors
      winston.format.timestamp({ format: 'HH:mm:ss' }), // Simple timestamp for console
      // Custom console format
      winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message} ${info.metadata?.error?.stack ? '\n' + info.metadata.error.stack : info.stack ? '\n' + info.stack : ''}`)
    ),
    level: 'debug', // Log debug messages and above to console in development
  }));
}

// --- Export Logger ---
// What it is: Makes the configured logger instance available for other modules.
// Why we use it: Allows other parts of the application to import and use the same logger.
// Links: To be imported by `server.js`, route files, etc.
module.exports = logger;