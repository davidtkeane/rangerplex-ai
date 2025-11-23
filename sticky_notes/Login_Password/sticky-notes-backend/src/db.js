/**
 * @file db.js
 * @description Handles SQLite database connection and initialization.
 *
 * What it is:
 * This module connects to the SQLite database file specified in the configuration.
 * It also ensures the necessary tables (users, tokens, etc.) are created if they
 * don't already exist and includes logic to add missing columns for backward compatibility.
 *
 * Why we use it:
 * - Encapsulates all database connection and schema setup logic.
 * - Separates database concerns from the main application logic (`server.js`) and routes.
 * - Provides a single, exported `db` instance for the rest of the application to use.
 *
 * Links:
 * - Imported by: `server.js` (to ensure connection), route files, potentially `middleware.js` (for session store).
 * - Uses: `sqlite3` library.
 * - Reads configuration: `config` object from `./config.js` (specifically `config.db.path`).
 * - Uses: `logger` from `./logging.js` for status messages and errors.
 */

const sqlite3 = require('sqlite3').verbose(); // Use verbose for more detailed stack traces on error
const config = require('./config'); // Load path from centralized config
const logger = require('./logging');

// --- Database Connection ---
// What it is: Creates the connection instance to the SQLite database file.
// Why we use it: Establishes the link between the application and the database file on disk.
// Links: Uses `config.db.path`. The callback handles connection success/failure and table setup.
logger.info(`Attempting to connect to database at: ${config.db.path}`);
const db = new sqlite3.Database(config.db.path, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    // Log fatal error if connection fails - app likely cannot function.
    logger.error(`FATAL ERROR opening/creating database: ${config.db.path}`, { error: err });
    // Provide hint for common permission issues
    if (err.code === 'SQLITE_CANTOPEN') {
      logger.error(`Hint: Check directory existence and write permissions for the database file and its parent directory.`);
    }
    process.exit(1); // Exit if DB connection fails
  } else {
    logger.info(`Successfully connected to the SQLite database: ${config.db.path}`);
    // Proceed with database initialization (setting pragmas, creating tables)
    initializeDatabase();
  }
});

// --- Database Initialization Function ---
// What it is: Sets up necessary PRAGMAs and ensures tables exist.
// Why we use it: Bundles schema setup logic triggered after a successful connection.
// Links: Called from the `sqlite3.Database` connection callback. Calls `createTables` and `addColumnsIfNeeded`.
function initializeDatabase() {
  db.serialize(() => { // Ensures commands run in sequence
    // Enable foreign key constraints for data integrity
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        logger.error("Error enabling foreign keys:", { error: pragmaErr });
      } else {
        logger.info("Foreign key support enabled in SQLite.");
      }
    });

    // Create tables if they don't exist
    createTables();

    // Add columns if needed (for backward compatibility from older schemas)
    // We run this after createTables to ensure the users table exists first.
    addColumnsIfNeeded();
  });
}

// --- Table Creation Function ---
// What it is: Defines and executes SQL commands to create application tables.
// Why we use it: Ensures the database schema is present for the application to work.
//              `IF NOT EXISTS` prevents errors if tables already exist.
// Links: Called by `initializeDatabase`. Defines schema for users, tokens, etc.
function createTables() {
    logger.info('Checking/Creating database tables...');

    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            is_verified INTEGER DEFAULT 0 NOT NULL, -- 0 = false, 1 = true
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`;

    const createPasswordResetTokensTable = `
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE -- Auto-delete tokens if user is deleted
        );`;

    const createEmailVerificationTokensTable = `
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );`;

    // Note: The 'sessions' table used by connect-sqlite3 will be created
    // automatically by that library when the session middleware is initialized.
    // We don't strictly need to define it here, but including it causes no harm.
    const createSessionsTable = `
        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY NOT NULL,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );`;


    db.exec(`
        ${createUsersTable}
        ${createPasswordResetTokensTable}
        ${createEmailVerificationTokensTable}
        ${createSessionsTable}
    `, (err) => {
        if (err) {
            logger.error('Error creating tables:', { error: err });
        } else {
            logger.info('Database tables checked/created successfully.');
        }
    });
}


// --- Add Columns Function ---
// What it is: Adds specific columns to the 'users' table if they don't already exist.
// Why we use it: Allows updating the schema (adding new user profile fields) without
//              requiring users to delete their existing database. Handles backward compatibility.
// Links: Called by `initializeDatabase` after `createTables`. Modifies the 'users' table schema.
function addColumnsIfNeeded() {
  logger.debug('Checking if columns need to be added to users table...');
  const columnsToAdd = [
    { name: 'display_name', type: 'TEXT' },
    { name: 'avatar_url', type: 'TEXT' },
    { name: 'is_verified', type: 'INTEGER DEFAULT 0 NOT NULL' }
  ];

  // Get current table structure
  db.all(`PRAGMA table_info(users)`, (err, columns) => {
    if (err) {
      logger.error(`Error getting table info for users:`, { error: err });
      return;
    }
    if (!Array.isArray(columns)) {
       logger.error(`PRAGMA table_info(users) did not return array. Cannot check columns.`);
       return;
    }

    const existingColumnNames = columns.map(col => col.name);
    logger.debug(`Existing columns in 'users': ${existingColumnNames.join(', ')}`);

    // Add each missing column
    columnsToAdd.forEach(col => {
      if (!existingColumnNames.includes(col.name)) {
        logger.info(`Attempting to add column '${col.name}' to 'users' table...`);
        db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (addErr) => {
          // Ignore "duplicate column name" error if run multiple times concurrently by mistake
          if (addErr && !addErr.message.includes('duplicate column name')) {
            logger.error(`Error adding column ${col.name} to users:`, { error: addErr });
          } else if (!addErr) {
            logger.info(`Column '${col.name}' added successfully to 'users' table.`);
          } else {
             logger.warn(`Column '${col.name}' likely already existed (duplicate column name error ignored).`)
          }
        });
      }
    });
  });
}

// --- Export Database Instance ---
// What it is: Exports the connected and initialized database object.
// Why we use it: Makes the single database connection available to other modules
//              that need to query or modify data.
// Links: To be imported by modules performing database operations (routes, helpers).
module.exports = db;