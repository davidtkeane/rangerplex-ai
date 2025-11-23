/**
 * @file config.js
 * @description Centralized configuration management for the application.
 *
 * What it is:
 * This module loads environment variables, defines application constants, sets up
 * file paths, and initializes external service configurations (like email).
 *
 * Why we use it:
 * - Consolidates all configuration settings into one place for easy management.
 * - Separates configuration logic from the main server logic (`server.js`).
 * - Makes it easy to access settings from different parts of the application.
 * - Uses environment variables (.env file) for sensitive or deployment-specific settings.
 * - Handles the setup of the Nodemailer email transporter based on `email-config.json`.
 *
 * Links:
 * - Imported by: `server.js`, `db.js`, `middleware.js`, route files (potentially).
 * - Uses: `dotenv`, `nodemailer`, `path`, `fs` libraries.
 * - Requires: `.env` file in the project root, `email-config.json` in the project root.
 * - Uses: `logger` from `./logging.js` for status messages and errors during setup.
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const logger = require('./logging'); // Import the logger

// --- Load Environment Variables ---
// What it is: Loads variables from the .env file into process.env.
// Why we use it: To keep sensitive data (like secrets) and deployment-specific
//              settings out of the source code.
// Links: Requires a .env file in the project root.
dotenv.config();
logger.info('Environment variables loaded from .env file.');

// --- Application Constants ---
const PORT = process.env.PORT || 3000;
const saltRounds = 10; // Cost factor for bcrypt hashing
const sessionSecret = process.env.SESSION_SECRET;
// Ensure FRONTEND_URL does NOT have a trailing slash
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- Validate Essential Environment Variables ---
// What it is: Checks if critical variables are loaded.
// Why we use it: Prevents the application from starting in an invalid state.
// Links: Checks variables loaded by dotenv.
if (!sessionSecret) {
  logger.error("FATAL ERROR: SESSION_SECRET missing in .env file. Application cannot start securely.");
  process.exit(1); // Exit if critical config is missing
}
if (!process.env.DATABASE_FILENAME) {
    logger.warn("Warning: DATABASE_FILENAME not found in .env. Using default 'database.db'.");
}
if (!process.env.FRONTEND_URL) {
    logger.warn(`Warning: FRONTEND_URL not found in .env. Using default '${FRONTEND_URL}'.`);
}


// --- File Paths ---
// What it is: Defines absolute paths used by the application.
// Why we use it: Centralizes path definitions, making them easier to manage and less prone to errors.
// Links: Uses Node.js 'path' module. `__dirname` refers to the directory of the *current file* (`src`),
//        so we use `path.resolve(__dirname, '..')` to get the project root directory.
const PROJECT_ROOT = path.resolve(__dirname, '..'); // Assumes config.js is in /src
const DB_FILENAME = process.env.DATABASE_FILENAME || 'database.db';
const DB_PATH = path.join(PROJECT_ROOT, DB_FILENAME); // Absolute path to DB in project root
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const EMAIL_CONFIG_PATH = path.join(PROJECT_ROOT, 'email-config.json');

// --- Ensure Upload Directories Exist ---
// What it is: Creates the 'uploads' and 'uploads/avatars' directories if they don't exist.
// Why we use it: Prevents errors during file uploads if directories are missing.
// Links: Uses Node.js 'fs' module.
try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR);
      logger.info(`Uploads directory created at: ${UPLOADS_DIR}`);
    }
    if (!fs.existsSync(AVATARS_DIR)) {
      fs.mkdirSync(AVATARS_DIR);
      logger.info(`Avatars directory created at: ${AVATARS_DIR}`);
    }
} catch (err) {
    logger.error(`Error creating upload directories: ${err.message}`, { error: err });
    // Decide if this is fatal or just log a warning
    // process.exit(1);
}


// --- Email Configuration ---
// What it is: Loads email settings from email-config.json and configures Nodemailer.
// Why we use it: Separates email credentials and setup from other code. Creates a reusable 'transporter'.
// Links: Requires `email-config.json`. Uses `nodemailer`. Exports `emailTransporter` and `emailConfig`.
let emailConfig = null;
let emailTransporter = null;

try {
  logger.info(`Attempting to load email config from: ${EMAIL_CONFIG_PATH}`);
  if (fs.existsSync(EMAIL_CONFIG_PATH)) {
    const configContent = fs.readFileSync(EMAIL_CONFIG_PATH, 'utf8');
    const fullConfig = JSON.parse(configContent);

    if (!fullConfig || !fullConfig.smtp) throw new Error("Missing 'smtp' section in email-config.json");
    emailConfig = fullConfig.smtp; //

    // Validate required SMTP fields
    const requiredSmtpFields = ['host', 'port', 'user', 'password', 'from'];
    const missingFields = requiredSmtpFields.filter(field => !emailConfig[field]);
    if (missingFields.length > 0) {
      throw new Error(`Incomplete SMTP config in email-config.json. Missing: ${missingFields.join(', ')}`);
    }

    logger.info("Email configuration loaded successfully.");

    // Create Nodemailer transporter
    emailTransporter = nodemailer.createTransport({
      host: emailConfig.host, //
      port: parseInt(emailConfig.port, 10), //
      secure: parseInt(emailConfig.port, 10) === 465, // true for 465, false for other ports
      auth: { user: emailConfig.user, pass: emailConfig.password }, //
      connectionTimeout: 15000, // 15 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 15000 // 15 seconds
    });

    // Verify transporter connection asynchronously (doesn't block startup)
    emailTransporter.verify((error, success) => {
      if (error) {
        logger.error('Error verifying email transporter connection:', { error: error });
        // Note: We don't nullify the transporter here; maybe it's a temporary issue.
        // Routes using email should check if `emailTransporter` is valid before sending.
      } else {
        logger.info('Email transporter verified successfully and ready to send emails.');
      }
    });

  } else {
    // Throw error if file not found, but log as warning as email might be optional
    logger.warn(`Email configuration file not found at: ${EMAIL_CONFIG_PATH}. Email functionality will be disabled.`);
    // throw new Error(`email-config.json not found at: ${EMAIL_CONFIG_PATH}`);
  }
} catch (err) {
  logger.error("Error loading or configuring email service:", { error: err });
  emailTransporter = null; // Ensure transporter is null if config fails critically
  emailConfig = null;
  // Decide if email failure is fatal or not. Currently logging error and continuing.
  // if (NODE_ENV === 'production') process.exit(1);
}

// --- Exported Configuration Object ---
// What it is: Bundles all settings into a single object for export.
// Why we use it: Provides a clean way for other modules to import and access settings.
module.exports = {
  port: PORT,
  saltRounds,
  sessionSecret,
  frontendUrl: FRONTEND_URL,
  nodeEnv: NODE_ENV,
  db: {
    filename: DB_FILENAME,
    path: DB_PATH,
  },
  uploads: {
    dir: UPLOADS_DIR,
    avatars: AVATARS_DIR,
  },
  email: {
    config: emailConfig, // The raw config loaded
    transporter: emailTransporter, // The configured Nodemailer transporter instance
    enabled: !!emailTransporter, // A flag indicating if email is likely usable
  },
  // You can add other configuration sections here as needed
};

// Log the finalized configuration (optional, be careful with secrets)
// logger.debug('Configuration loaded:', { config: module.exports }); // Avoid logging secrets in production
logger.info(`Configuration loaded. DB Path: ${module.exports.db.path}, Frontend URL: ${module.exports.frontendUrl}, Email Enabled: ${module.exports.email.enabled}`);