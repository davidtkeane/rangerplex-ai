/**
 * @file routes/auth.js
 * @description Authentication-related routes (register, login, logout, verify, recovery).
 *
 * What it is:
 * This module defines an Express Router specifically for handling all authentication
 * API endpoints under the '/api/auth' prefix. It includes logic for user creation,
 * session management, password hashing, token generation/validation, and email sending.
 *
 * Why we use it:
 * - Groups all authentication logic together, improving code organization.
 * - Separates authentication concerns from profile management or other API features.
 * - Makes the main `server.js` file cleaner by removing route definitions.
 *
 * Links:
 * - Mounted in: `server.js` under the '/api/auth' path.
 * - Uses: `express.Router`, `bcrypt`, `crypto`, `url`.
 * - Reads configuration: `config` object from `../config.js`.
 * - Uses database: `db` instance from `../db.js`.
 * - Uses logger: `logger` from `../logging.js`.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { URL } = require('url'); // For constructing verification/reset links
const db = require('../db'); // Database connection
const config = require('../config'); // Centralized configuration
const logger = require('../logging'); // Centralized logger

const router = express.Router(); // Create a new router instance

// === Helper Functions ===

/**
 * Finds a user by email (case-insensitive).
 * NOTE: Consider moving shared DB helpers to a dedicated utils file later.
 * @param {string} email - The email address to search for.
 * @returns {Promise<object|null>} A promise that resolves with the user object or null if not found.
 */
function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    // Using LOWER() for case-insensitive comparison in SQL
    db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email], (err, row) => {
      if (err) {
        logger.error("[Helper findUserByEmail] DB Error:", { error: err });
        reject(new Error("Database query error finding user by email."));
      } else {
        resolve(row); // row will be the user object or null if not found
      }
    });
  });
}

// === Authentication Routes ===

/**
 * @route POST /api/auth/register
 * @description Registers a new user, sends verification email.
 */
router.post('/register', async (req, res) => {
  logger.info("[Register] Received request for email: %s", req.body.email);
  const { email, password } = req.body;

  // --- Input Validation ---
  if (!email || !password || password.length < 8 || !/\S+@\S+\.\S+/.test(email)) {
    logger.warn("[Register] Validation failed for email: %s", email);
    return res.status(400).json({ error: 'Valid email and password (min 8 characters) are required.' });
  }

  // --- Check Email Service ---
  if (!config.email.enabled || !config.email.transporter) {
    logger.error("[Register] Cannot proceed: Email service not configured or disabled.");
    return res.status(503).json({ error: 'Email service is currently unavailable. Cannot create account.' });
  }

  try {
    // --- Check Existing User ---
    logger.debug("[Register] Checking existing user for email: %s", email);
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      if (existingUser.is_verified === 0) {
        logger.info("[Register] Email exists but is unverified: %s", email);
        return res.status(409).json({ error: 'This email is already registered but not verified. Please check your email for the verification link or request a password reset.' });
      } else {
        logger.info("[Register] Email already exists and is verified: %s", email);
        return res.status(409).json({ error: 'Email already in use. Please log in or use a different email.' });
      }
    }

    // --- Hash Password ---
    logger.debug("[Register] Hashing password for email: %s", email);
    const passwordHash = await bcrypt.hash(password, config.saltRounds);

    // --- Insert User ---
    logger.debug("[Register] Inserting new user (unverified) for email: %s", email);
    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (email, password_hash, is_verified) VALUES (?, ?, 0)',
             [email, passwordHash], function(err) { // Use function() to access this.lastID
        if (err) {
          logger.error("[Register] DB Insert Error:", { error: err });
          reject(new Error("Database error during registration."));
        } else {
          logger.info("[Register] DB Insert Success. User ID: %s for email: %s", this.lastID, email);
          resolve({ id: this.lastID });
        }
      });
    });
    const userId = result.id;

    // --- Generate & Store Verification Token ---
    logger.debug("[Register] Generating verification token for user ID: %s", userId);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // Expires in 24 hours

    await new Promise((resolve, reject) => {
      logger.debug("[Register] Deleting old verification tokens for user ID: %s", userId);
      db.run('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId], (delErr) => {
        if (delErr) logger.error("[Register] Error deleting old verification tokens:", { error: delErr }); // Log but continue

        logger.debug("[Register] Storing new verification token hash for user ID: %s", userId);
        db.run('INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
               [userId, verificationTokenHash, verificationExpiresAt.toISOString()], function(insErr) {
          if (insErr) {
            logger.error("[Register] DB Error storing verification token:", { error: insErr });
            reject(new Error("Database error storing verification token."));
          } else {
            resolve();
          }
        });
      });
    });

    // --- Construct Verification Link ---
    // Use raw token in link, hashed token in DB
    const verificationLink = new URL('/verify-email.html', config.frontendUrl);
    verificationLink.searchParams.set('token', verificationToken);
    const verificationLinkString = verificationLink.toString();
    logger.info(`[Register] Verification link generated for user ID ${userId}: ${verificationLinkString}`);

    // --- Send Verification Email ---
    const mailOptions = {
      from: `"Secure Portal" <${config.email.config.from}>`,
      to: email,
      subject: 'Welcome! Please Verify Your Email Address',
      text: `Welcome!\n\nPlease click this link to verify your email and activate your account:\n${verificationLinkString}\n\nThis link expires in 24 hours.\n\nIf you didn't sign up, please ignore this email.\n\nThanks,\nThe Secure Portal Team`,
      html: `<p>Welcome!</p><p>Please click the button below to verify your email address and activate your account:</p><p><a href="${verificationLinkString}" style="background-color:#0ea5e9;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Verify Email Address</a></p><p>Link: <a href="${verificationLinkString}">${verificationLinkString}</a></p><p>This link expires in 24 hours.</p><p>If you didn't sign up, please ignore this email.</p><p>Thanks,<br>The Secure Portal Team</p>`
    };

    try {
      logger.info("[Register] Attempting to send verification email to: %s", email);
      const info = await config.email.transporter.sendMail(mailOptions);
      logger.info(`[Register] Verification email sent successfully to: %s. Message ID: %s`, email, info.messageId);
      res.status(201).json({ message: 'Account created! Please check your email to verify your account.' });
    } catch (emailError) {
      logger.error(`[Register] Failed to send verification email to ${email}:`, { error: emailError });
      // IMPORTANT: Account IS created. Inform user appropriately.
      res.status(500).json({ error: 'Account created, but failed to send verification email. Please contact support or try password recovery later.' });
    }

  } catch (error) {
    logger.error("[Register] Catch Block Error:", { error: error });
    res.status(500).json({ error: error.message || 'An error occurred during registration.' });
  }
});

/**
 * @route POST /api/auth/verify-email
 * @description Verifies user's email using the provided token.
 */
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  logger.info("[Verify Email] Received request for token: %s", token ? token.substring(0, 10)+'...' : 'No Token');

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    logger.debug("[Verify Email] Finding token record for hash: %s", tokenHash.substring(0,10)+'...');
    const tokenRecord = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM email_verification_tokens WHERE token_hash = ? AND expires_at > ?',
             [tokenHash, now.toISOString()], (err, row) => {
        if (err) { logger.error("[Verify Email] DB Error finding token:", { error: err }); reject(new Error("Database error finding token.")); }
        else resolve(row);
      });
    });

    // Handle invalid or expired token
    if (!tokenRecord) {
        logger.warn("[Verify Email] Invalid or expired token hash: %s", tokenHash.substring(0,10)+'...');
        // Check if the user might *already* be verified (e.g., clicked link twice)
        const potentialUser = await new Promise((resolve) => {
            db.get(`SELECT u.id, u.is_verified FROM users u JOIN email_verification_tokens t ON u.id = t.user_id WHERE t.token_hash = ?`, [tokenHash], (err, row) => resolve(row)); // Ignore errors here
        });
        if (potentialUser?.is_verified === 1) {
             logger.info(`[Verify Email] Token was likely already used for user ${potentialUser.id}. Treating as success.`);
             // Clean up the (likely expired) token
             db.run('DELETE FROM email_verification_tokens WHERE token_hash = ?', [tokenHash], (delErr) => { if (delErr) logger.error(`[Verify Email] Error deleting already-used/expired token`, { error: delErr }); });
             return res.status(200).json({ message: 'Email already verified! You can log in.' });
        }
        return res.status(400).json({ error: 'Invalid or expired verification token. Please register again or request verification.' });
    }

    // Token is valid, update user status
    const userId = tokenRecord.user_id;
    logger.info(`[Verify Email] Token found for user ID: ${userId}. Updating user status...`);
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET is_verified = 1 WHERE id = ? AND is_verified = 0', [userId], function(err) {
        if (err) { logger.error("[Verify Email] DB Error updating user:", { error: err }); reject(new Error("Database error updating user status.")); }
        else if (this.changes === 0) { logger.warn(`[Verify Email] User ${userId} already verified or not found during update.`); }
        else { logger.info(`[Verify Email] User ${userId} successfully verified.`); }
        resolve();
      });
    });

    // Delete the used token
    logger.debug("[Verify Email] Deleting used token ID: %s", tokenRecord.id);
    await new Promise((resolve) => { // Don't reject on delete error
      db.run('DELETE FROM email_verification_tokens WHERE id = ?', [tokenRecord.id], (err) => {
        if (err) logger.error(`[Verify Email] Error deleting token ID ${tokenRecord.id}:`, { error: err });
        resolve();
      });
    });

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });

  } catch (error) {
    logger.error("[Verify Email] Catch Block Error:", { error: error });
    res.status(500).json({ error: error.message || 'An error occurred during email verification.' });
  }
});


/**
 * @route POST /api/auth/login
 * @description Logs in a user, creates a session.
 */
router.post('/login', async (req, res) => {
  logger.info("[Login] Received request for email: %s", req.body.email);
  const { email, password } = req.body;

  // --- Input Validation ---
   if (!email || !password || !/\S+@\S+\.\S+/.test(email)) {
       logger.warn("[Login] Validation failed for email: %s", email);
       return res.status(400).json({ error: 'Valid email and password are required.' });
   }

  try {
    // --- Find User ---
    logger.debug("[Login] Finding user: %s", email);
    const user = await findUserByEmail(email);

    if (!user) {
      logger.warn(`[Login] Email not found: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password.' }); // Generic error
    }

    // --- Check Verification Status ---
    if (user.is_verified === 0) {
        logger.warn(`[Login] Attempt by unverified user: ${email} (ID: ${user.id})`);
        return res.status(403).json({ error: 'Account not verified. Please check your email for the verification link.' }); // 403 Forbidden
    }

    // --- Compare Password ---
    logger.debug("[Login] User found and verified (ID: %s). Comparing password...", user.id);
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      logger.warn(`[Login] Invalid password for user: ${email} (ID: ${user.id})`);
      return res.status(401).json({ error: 'Invalid email or password.' }); // Generic error
    }

    // --- Login Success: Regenerate Session ---
    logger.info("[Login] Password match success for user ID: %s. Regenerating session...", user.id);
    req.session.regenerate((err) => {
      if (err) {
        logger.error("[Login] Session regeneration error:", { error: err });
        return res.status(500).json({ error: 'Error setting up session.' });
      }

      // --- Store User Data in Session ---
      logger.debug("[Login] Session regenerated (ID: %s). Setting session user data...", req.sessionID);
      // Store essential, non-sensitive user data
      req.session.user = {
        id: user.id,
        email: user.email,
        // We could add displayName and avatarUrl here too if needed immediately after login
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      };

      // ---->>>> ADDED LOGGING HERE <<<<----
      // Log the user data we are *about* to try saving to the session store.
      logger.debug('[Login] Value of req.session.user JUST BEFORE save:', JSON.stringify(req.session.user));

      // --- Save Session and Respond ---
      req.session.save(saveErr => {
        // ---->>>> ADDED LOGGING HERE <<<<----
        // Log whether the save operation itself reported an error.
        if (saveErr) {
          logger.error("[Login] Session save error:", { error: saveErr });
          // Note: Even if save fails, the session *might* still partially exist in memory,
          // but it wouldn't persist correctly or be retrieved properly later.
          return res.status(500).json({ error: 'Error saving session data.' });
        }
        // Log success only if saveErr is null
        logger.info(`[Login] req.session.save() completed successfully for Session ID: ${req.sessionID}.`);
        logger.info(`[Login] Success: User ${user.email} (ID: ${user.id}) logged in. Session ID: ${req.sessionID}.`);

        // Send back safe user details needed by frontend
        res.status(200).json({
          message: 'Login successful.',
          user: { // Send the same data we tried to store in the session
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url
          }
        });
      });
    });
  } catch (error) {
    logger.error("[Login] Catch Block Error:", { error: error });
    res.status(500).json({ error: error.message || 'An error occurred during login.' });
  }
});

/**
 * @route POST /api/auth/logout
 * @description Logs out the current user by destroying the session.
 */
router.post('/logout', (req, res) => {
  const userId = req.session?.user?.id || 'Unknown';
  const userEmail = req.session?.user?.email || 'user';
  logger.info(`[Logout] Received request for user ID: ${userId} (${userEmail})`);

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        logger.error(`[Logout] Error destroying session for user ID ${userId}:`, { error: err });
        return res.status(500).json({ error: 'Could not log out, please try again.' });
      }
      // Clear the session cookie from the browser
      const cookieName = req.sessionOptions?.name || 'connect.sid'; // Get session cookie name
      res.clearCookie(cookieName); // Ensure path/domain match if needed
      logger.info(`[Logout] Session destroyed successfully for user ID: ${userId}`);
      res.status(200).json({ message: 'Logged out successfully.' });
    });
  } else {
    logger.warn(`[Logout] Attempt with no active session.`);
    res.status(200).json({ message: 'No active session to log out from.' });
  }
});


/**
 * @route POST /api/auth/recover-password
 * @description Sends a password recovery link to the user's email.
 */
router.post('/recover-password', async (req, res) => {
  logger.info("[Recover PW] Received request for email: %s", req.body.email);
  const { email } = req.body;

  // --- Basic Format Validation ---
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
      logger.warn("[Recover PW] Validation failed: Invalid email format (%s). Sending generic response.", email);
      // IMPORTANT: Always send a generic success message to prevent email enumeration.
      return res.status(200).json({ message: 'If an account with that email exists and is verified, a password reset link has been sent.' });
  }

  // --- Check Email Service ---
  if (!config.email.enabled || !config.email.transporter) {
    logger.error("[Recover PW] Attempt failed: Email service not configured or disabled.");
    return res.status(503).json({ error: 'Password recovery service is temporarily unavailable. Please try again later.' });
  }

  try {
    // --- Find User (Case-Insensitive) ---
    logger.debug(`[Recover PW] Finding user for email: ${email}`);
    const user = await findUserByEmail(email);

    // --- Handle User Not Found or Unverified ---
    if (!user || user.is_verified === 0) {
      logger.warn(`[Recover PW] User not found, unverified, or email mismatch for: ${email}. Sending generic response.`);
      // IMPORTANT: Always send the *same* generic success message.
      return res.status(200).json({ message: 'If an account with that email exists and is verified, a password reset link has been sent.' });
    }

    // --- User Found and Verified: Generate & Store Token ---
    logger.info(`[Recover PW] Verified user found: ID ${user.id}. Generating token...`);
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // Expires in 1 hour

    await new Promise((resolve, reject) => {
      logger.debug("[Recover PW] Deleting old reset tokens for user ID: %s", user.id);
      db.run('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id], (delErr) => {
        if (delErr) logger.error(`[Recover PW] Error deleting old reset tokens for user ${user.id}:`, { error: delErr });

        logger.debug("[Recover PW] Storing new reset token hash for user ID: %s", user.id);
        db.run('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
               [user.id, tokenHash, expiresAt.toISOString()], function(insErr) {
          if (insErr) { logger.error(`[Recover PW] DB Error storing reset token for user ${user.id}:`, { error: insErr }); reject(new Error("Database error storing reset token.")); }
          else { logger.info(`[Recover PW] Reset token stored successfully for user ${user.id}.`); resolve(); }
        });
      });
    });

    // --- Construct & Send Reset Email ---
    const resetLink = new URL('/reset-password.html', config.frontendUrl);
    resetLink.searchParams.set('token', token); // Use raw token in link
    const resetLinkString = resetLink.toString();
    logger.info(`[Recover PW] Reset link generated for user ${user.id}: ${resetLinkString}`);
    const userName = user.display_name ? user.display_name.split(' ')[0] : 'there';

    const mailOptions = {
        from: `"Secure Portal" <${config.email.config.from}>`,
        to: user.email,
        subject: 'Password Reset Request - Secure Portal',
        text: `Hello ${userName},\n\nYou requested a password reset.\n\nClick here to set a new password:\n${resetLinkString}\n\nThis link is valid for 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nThanks,\nThe Secure Portal Team`,
        html: `<p>Hello ${userName},</p><p>You requested a password reset.</p><p>Click the button below to set a new password:</p><p><a href="${resetLinkString}" style="background-color:#f59e0b;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Your Password</a></p><p>Link: <a href="${resetLinkString}">${resetLinkString}</a></p><p><strong>This link is valid for 1 hour.</strong></p><p>If you didn't request this, ignore this email.</p><p>Thanks,<br>The Secure Portal Team</p>`
    };

    try {
      logger.info(`[Recover PW] Attempting to send password reset email to ${user.email}...`);
      const info = await config.email.transporter.sendMail(mailOptions);
      logger.info(`[Recover PW] Password reset email sent successfully to: ${user.email}. Message ID: ${info.messageId}`);
    } catch (emailError) {
      logger.error(`[Recover PW] Failed to send password reset email to ${user.email}:`, { error: emailError });
      // IMPORTANT: Do not reveal email failure. Send the generic success message anyway.
    }

    // --- Send Generic Success Response (ALWAYS) ---
    res.status(200).json({ message: 'If an account with that email exists and is verified, a password reset link has been sent.' });

  } catch (error) {
    logger.error("[Recover PW] Catch Block Error:", { error: error });
    // Send a generic server error, avoid specifics if possible
    res.status(500).json({ error: 'An internal error occurred. Please try again later.' });
  }
});


/**
 * @route POST /api/auth/reset-password
 * @description Resets the user's password using a valid token.
 */
router.post('/reset-password', async (req, res) => {
  logger.info("[Reset PW] Received request for token: %s", req.body.token ? req.body.token.substring(0, 10)+'...' : 'No Token');
  const { token, password } = req.body;

  // --- Input Validation ---
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    // --- Find Valid Token Record ---
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    logger.debug(`[Reset PW] Finding token hash: ${tokenHash.substring(0,10)}...`);

    const tokenRecord = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ?',
             [tokenHash, now.toISOString()], (err, row) => {
        if (err) { logger.error("[Reset PW] DB Error finding reset token:", { error: err }); reject(new Error("Database error finding reset token.")); }
        else { resolve(row); }
      });
    });

    if (!tokenRecord) {
      logger.warn("[Reset PW] Password reset attempt with invalid or expired token hash: %s", tokenHash.substring(0,10)+'...');
      return res.status(400).json({ error: 'Invalid or expired password reset token. Please request a new one.' });
    }

    // --- Token Valid: Hash New Password ---
    logger.info(`[Reset PW] Valid token found for user ID: ${tokenRecord.user_id}. Hashing new password...`);
    const newPasswordHash = await bcrypt.hash(password, config.saltRounds);

    // --- Update User's Password ---
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password_hash = ? WHERE id = ?',
             [newPasswordHash, tokenRecord.user_id], function(err) {
        if (err) { logger.error(`[Reset PW] DB Error updating password for user ${tokenRecord.user_id}:`, { error: err }); reject(new Error("Database error updating password.")); }
        else if (this.changes === 0) { logger.error(`[Reset PW] Password reset failed: User ID ${tokenRecord.user_id} not found during update.`); reject(new Error("User not found during password update.")); }
        else { logger.info(`[Reset PW] Password successfully updated in DB for user ID: ${tokenRecord.user_id}`); resolve(); }
      });
    });

    // --- Delete Used Token ---
    logger.debug(`[Reset PW] Deleting used reset token ID ${tokenRecord.id}...`);
    await new Promise((resolve) => { // Don't reject on delete error
      db.run('DELETE FROM password_reset_tokens WHERE id = ?', [tokenRecord.id], (err) => {
        if (err) logger.error(`[Reset PW] Error deleting used reset token ID ${tokenRecord.id}:`, { error: err });
        else logger.info(`[Reset PW] Successfully deleted used reset token ID ${tokenRecord.id}.`);
        resolve();
      });
    });

    // --- Send Success Response ---
    res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

  } catch (error) {
    logger.error("[Reset PW] Catch Block Error:", { error: error });
    res.status(500).json({ error: error.message || 'An error occurred while resetting your password.' });
  }
});


// Export the router
module.exports = router;
logger.info('Authentication routes configured.'); // This log might appear early during initial load
