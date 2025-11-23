/**
 * @file routes/profile.js
 * @description Profile-related routes (fetch, update display name, avatar, password).
 * All routes in this file require authentication.
 *
 * What it is:
 * This module defines an Express Router for handling all profile management
 * API endpoints under the '/api/profile' prefix. It requires users to be
 * authenticated for all its routes.
 *
 * Why we use it:
 * - Groups all profile management logic together.
 * - Separates user profile concerns from authentication or other features.
 * - Ensures consistent authentication checks via the `isAuthenticated` middleware.
 *
 * Links:
 * - Mounted in: `server.js` under the '/api/profile' path.
 * - Uses: `express.Router`, `bcrypt`, `fs`, `path`.
 * - Reads configuration: `config` object from `../config.js`.
 * - Uses database: `db` instance from `../db.js`.
 * - Uses logger: `logger` from `../logging.js`.
 * - Uses middleware: `isAuthenticated`, `uploadAvatar` from `../middleware.js`.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs'); // For file system operations (deleting old avatars)
const path = require('path'); // For constructing file paths
const db = require('../db'); // Database connection
const config = require('../config'); // Centralized configuration
const logger = require('../logging'); // Centralized logger
const { isAuthenticated, uploadAvatar } = require('../middleware'); // Import necessary middleware

const router = express.Router();

// --- Apply Authentication Middleware ---
// What it is: Ensures *all* routes defined in this file require the user to be logged in.
// Why we use it: Protects user-specific profile data and actions.
// Links: Uses the `isAuthenticated` middleware defined in `middleware.js`.
router.use(isAuthenticated);

// === Profile Routes ===

/**
 * @route GET /api/profile
 * @description Fetches the profile data for the currently logged-in user.
 * @middleware isAuthenticated (applied globally via router.use)
 */
router.get('/', async (req, res) => {
  const userId = req.session.user.id; // Get user ID from authenticated session
  logger.info(`[Get Profile] Request received for user ID: ${userId}`);

  try {
    // Fetch user data, excluding sensitive info like password hash
    const userProfile = await new Promise((resolve, reject) => {
      db.get('SELECT id, email, display_name, avatar_url, created_at, is_verified FROM users WHERE id = ?',
             [userId], (err, row) => {
        if (err) {
          logger.error(`[Get Profile] DB Error fetching profile for user ${userId}:`, { error: err });
          reject(new Error("Database error fetching profile."));
        } else if (!row) {
          // Should not happen if session is valid, indicates potential issue
          logger.warn(`[Get Profile] User profile not found in DB for authenticated user ID ${userId}. Session might be stale.`);
          reject(new Error("User profile not found. Session may be invalid.")); // Custom error
        } else {
          logger.debug(`[Get Profile] Profile data fetched successfully for user ID: ${userId}`);
          resolve(row); // Return the user profile data
        }
      });
    });
    res.status(200).json(userProfile);
  } catch (error) {
    logger.error(`[Get Profile] Catch Block Error for user ID ${userId}:`, { error: error });
    // Handle specific error for "not found" vs. general DB error
    if (error.message.includes("User profile not found")) {
      res.status(404).json({ error: error.message + " Please log out and log back in." });
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch profile data.' });
    }
  }
});

/**
 * @route PUT /api/profile
 * @description Updates the display name for the currently logged-in user.
 * @middleware isAuthenticated (applied globally via router.use)
 */
router.put('/', async (req, res) => {
  const userId = req.session.user.id;
  const { displayName } = req.body;
  logger.info(`[Update Profile] Request received for user ID: ${userId}`, { data: req.body });

  // --- Input Validation ---
  if (typeof displayName !== 'string') {
    logger.warn(`[Update Profile] Invalid display name format for user ID: ${userId}`);
    return res.status(400).json({ error: 'Invalid display name format.' });
  }
  const trimmedDisplayName = displayName.trim();
  if (trimmedDisplayName.length === 0 || trimmedDisplayName.length > 50) {
    logger.warn(`[Update Profile] Display name length invalid for user ID: ${userId} (Length: ${trimmedDisplayName.length})`);
    return res.status(400).json({ error: 'Display name must be between 1 and 50 characters.' });
  }

  try {
    // --- Update Database ---
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET display_name = ? WHERE id = ?',
             [trimmedDisplayName, userId], function(err) {
        if (err) {
          logger.error(`[Update Profile] DB Error updating display name for user ${userId}:`, { error: err });
          reject(new Error("Database error updating display name."));
        } else if (this.changes === 0) {
          // Should not happen if authenticated correctly
          logger.warn(`[Update Profile] User not found during update (ID: ${userId}).`);
          reject(new Error("User not found for update.")); // Custom error
        } else {
          logger.info(`[Update Profile] Display name updated successfully for user ID: ${userId}`);
          resolve();
        }
      });
    });

    // Optionally: Update display name in the current session if stored/needed there
    // if (req.session.user) req.session.user.displayName = trimmedDisplayName;
    // req.session.save(); // Save session if modified

    res.status(200).json({ message: 'Profile updated successfully.', displayName: trimmedDisplayName });
  } catch (error) {
    logger.error(`[Update Profile] Catch Block Error for user ID ${userId}:`, { error: error });
    // Handle specific "not found" error or general server error
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to update profile.' });
  }
});

/**
 * @route POST /api/profile/avatar
 * @description Uploads or updates the avatar for the currently logged-in user.
 * @middleware isAuthenticated (applied globally via router.use)
 * @middleware uploadAvatar.single('avatar') (Multer middleware specific to this route)
 */
router.post('/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  // Note: Multer middleware (`uploadAvatar.single`) runs *before* this async handler.
  // If Multer encounters an error (wrong file type, size limit), it passes the error
  // to Express's default error handler *unless* we handle it specifically here
  // or provide a custom Multer error handler. For simplicity now, we assume
  // Multer succeeded if we reach this point without `req.file` being undefined.
  // A more robust implementation might add a dedicated Multer error handler middleware.

  const userId = req.session.user.id;
  logger.info(`[Update Avatar] Request received for user ID: ${userId}`);

  // --- Check if File was Uploaded by Multer ---
  if (!req.file) {
    // This might happen if the form field name is wrong or Multer had an issue not caught before.
    logger.warn(`[Update Avatar] No file present in request for user ID: ${userId}. Check form field name ('avatar').`);
    return res.status(400).json({ error: 'No avatar file uploaded or upload failed.' });
  }

  // --- File Uploaded Successfully by Multer ---
  // Construct the relative URL path to serve the avatar
  // Path must align with how express.static is configured in server.js ('/uploads')
  const avatarUrlPath = `/uploads/avatars/${req.file.filename}`.replace(/\\/g, '/'); // Normalize slashes
  logger.info(`[Update Avatar] File uploaded via Multer for user ${userId}: ${req.file.path}, URL path will be: ${avatarUrlPath}`);

  let oldAvatarDbPath = null; // Variable to store the old path for potential deletion

  try {
    // --- Get Old Avatar Path (Before Update) ---
    logger.debug(`[Update Avatar] Fetching old avatar URL for user ${userId} before update...`);
    const oldProfile = await new Promise((resolve, reject) => {
      db.get('SELECT avatar_url FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
          logger.error(`[Update Avatar] DB error getting old avatar URL for user ${userId}:`, { error: err });
          // Don't fail the whole upload, but log it. Proceed to update DB.
          resolve(null);
        } else {
          resolve(row); // row might be null or have null avatar_url
        }
      });
    });

    if (oldProfile?.avatar_url) {
      oldAvatarDbPath = oldProfile.avatar_url; // Store the relative path from DB
      logger.debug(`[Update Avatar] Found old avatar URL in DB for user ${userId}: ${oldAvatarDbPath}`);
    } else {
       logger.debug(`[Update Avatar] No previous avatar URL found in DB for user ${userId}.`);
    }

    // --- Update Database with New Avatar Path ---
    logger.debug(`[Update Avatar] Updating avatar_url in DB for user ${userId} to: ${avatarUrlPath}`);
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET avatar_url = ? WHERE id = ?',
             [avatarUrlPath, userId], function(err) {
        if (err) {
          logger.error(`[Update Avatar] DB Error updating avatar URL for user ${userId}:`, { error: err });
          reject(new Error("Database error updating avatar URL.")); // Reject if DB update fails
        } else if (this.changes === 0) {
          logger.warn(`[Update Avatar] User not found during avatar URL update (ID: ${userId}).`);
          reject(new Error("User not found for avatar update."));
        } else {
          logger.info(`[Update Avatar] Avatar URL updated successfully in DB for user ID: ${userId}.`);
          resolve();
        }
      });
    });

    // --- Delete Old Avatar File (After Successful DB Update) ---
    if (oldAvatarDbPath) {
      // Construct the absolute path on the server's filesystem
      const oldAvatarDiskPath = path.join(config.uploads.dir, '..', oldAvatarDbPath); // Go up one level from config.uploads.dir if it's relative to project root, adjust if needed
      // Make sure the path starts within the project uploads directory for security
      const resolvedOldPath = path.resolve(config.uploads.dir, path.basename(oldAvatarDbPath)); // Simplistic: assumes old path was just /uploads/avatars/filename.png
      const resolvedAvatarDir = path.resolve(config.uploads.avatars);

       // Security check: ensure we are deleting within the avatars directory
       if(resolvedOldPath.startsWith(resolvedAvatarDir)) {
          logger.info(`[Update Avatar] Attempting to delete old avatar file: ${resolvedOldPath}`);
          fs.unlink(resolvedOldPath, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== 'ENOENT') { // Ignore 'file not found' errors
              logger.error(`[Update Avatar] Error deleting old avatar ${resolvedOldPath}:`, { error: unlinkErr });
            } else if (unlinkErr?.code === 'ENOENT') {
                 logger.warn(`[Update Avatar] Old avatar file not found, skipping deletion: ${resolvedOldPath}`);
            } else {
              logger.info(`[Update Avatar] Old avatar deleted successfully: ${resolvedOldPath}`);
            }
          });
       } else {
           logger.error(`[Update Avatar] Attempted to delete file outside designated avatars directory. Path: ${resolvedOldPath}. Deletion blocked.`);
       }
    }

    // --- Success Response ---
    // Optionally update session here if avatarUrl is stored there
    res.status(200).json({ message: 'Avatar uploaded successfully.', avatarUrl: avatarUrlPath });

  } catch (dbError) {
    // --- Handle DB Update Errors (Try to Clean Up Uploaded File) ---
    logger.error(`[Update Avatar] DB/Post-Upload Catch Block Error for user ID ${userId}:`, { error: dbError });
    // If DB update failed after file upload, delete the newly uploaded file
    logger.warn(`[Update Avatar] Attempting cleanup of uploaded file due to error: ${req.file.path}`);
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) {
        logger.error(`[Update Avatar] CRITICAL: Error deleting newly uploaded file after DB error: ${req.file.path}`, { error: unlinkErr });
      } else {
        logger.info(`[Update Avatar] Cleaned up uploaded file after error: ${req.file.path}`);
      }
    });
    // Send appropriate error response
    const statusCode = dbError.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ error: dbError.message || 'Failed to save avatar information.' });
  }
});


/**
 * @route PUT /api/profile/password
 * @description Changes the password for the currently logged-in user.
 * @middleware isAuthenticated (applied globally via router.use)
 */
router.put('/password', async (req, res) => {
  const userId = req.session.user.id;
  const { currentPassword, newPassword } = req.body;
  logger.info(`[Change PW] Request received for user ID: ${userId}`);

  // --- Input Validation ---
  if (!currentPassword || !newPassword) {
    logger.warn(`[Change PW] Missing passwords for user ID: ${userId}`);
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 8) {
    logger.warn(`[Change PW] New password too short for user ID: ${userId}`);
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }
  if (currentPassword === newPassword) {
    logger.warn(`[Change PW] New password same as current for user ID: ${userId}`);
    return res.status(400).json({ error: 'New password cannot be the same as the current password.' });
  }

  try {
    // --- Get Current Password Hash ---
    logger.debug(`[Change PW] Fetching current hash for user ${userId}...`);
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT password_hash FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) { logger.error(`[Change PW] DB Error fetching hash for user ${userId}:`, { error: err }); reject(new Error("Database error fetching user data.")); }
        else if (!row) { logger.warn(`[Change PW] User not found for password change (ID: ${userId}). Session might be invalid.`); reject(new Error("User not found.")); } // Custom error
        else { resolve(row); } // Contains { password_hash: '...' }
      });
    });

    // --- Verify Current Password ---
    logger.debug(`[Change PW] Comparing current password for user ${userId}...`);
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      logger.warn(`[Change PW] Incorrect current password for user ${userId}.`);
      return res.status(401).json({ error: 'Incorrect current password.' }); // 401 Unauthorized specifically for wrong current PW
    }

    // --- Current Password Verified: Hash and Update ---
    logger.info(`[Change PW] Current password verified for user ${userId}. Hashing new password...`);
    const newPasswordHash = await bcrypt.hash(newPassword, config.saltRounds);

    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password_hash = ? WHERE id = ?',
             [newPasswordHash, userId], function(err) {
        if (err) { logger.error(`[Change PW] DB Error updating password for user ${userId}:`, { error: err }); reject(new Error("Database error updating password.")); }
        else if (this.changes === 0) { logger.warn(`[Change PW] User ${userId} found initially but not found during password update.`); reject(new Error("User not found during password update.")); } // Should not happen
        else { logger.info(`[Change PW] Password changed successfully in DB for user ID: ${userId}`); resolve(); }
      });
    });

    // --- Success Response ---
    // Optional: Consider forcing logout here for enhanced security.
    res.status(200).json({ message: 'Password changed successfully.' });

  } catch (error) {
    logger.error(`[Change PW] Catch Block Error for user ID ${userId}:`, { error: error });
    // Handle specific "User not found" or general errors
    const statusCode = error.message.includes("User not found") ? 404 : 500;
    if(error.message === 'Incorrect current password.') statusCode = 401; // Ensure correct code for this specific case
    res.status(statusCode).json({ error: error.message || 'An error occurred while changing the password.' });
  }
});


// Export the router
module.exports = router;
logger.info('Profile routes configured.');