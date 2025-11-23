/**
 * Handles fetching and updating user settings, including avatar preview and upload.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const avatarPreview = document.getElementById('avatarPreview'); // The <img> tag
    const avatarPlaceholder = document.getElementById('avatarPlaceholder'); // The placeholder SVG/div
    const avatarUploadInput = document.getElementById('avatarUpload');
    const displayNameInput = document.getElementById('displayName');
    const emailDisplayInput = document.getElementById('emailDisplay'); // Input to display email
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const logoutButton = document.getElementById('logoutButton');

    // Feedback divs
    const avatarFeedback = document.getElementById('avatarFeedback');
    const profileFeedback = document.getElementById('profileFeedback');
    const passwordFeedback = document.getElementById('passwordFeedback');
    const logoutFeedback = document.getElementById('logoutFeedback');

    // Buttons and Spinners
    const saveProfileButton = document.getElementById('saveProfileButton');
    const saveProfileText = document.getElementById('saveProfileText');
    const saveProfileSpinner = document.getElementById('saveProfileSpinner');
    const changePasswordButton = document.getElementById('changePasswordButton');
    const changePasswordText = document.getElementById('changePasswordText');
    const changePasswordSpinner = document.getElementById('changePasswordSpinner');

    // --- Constants ---
    const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed
    const LOGIN_PAGE_URL = 'login_page.html'; // Redirect target on session expiry

    // --- Helper: API Fetch Function ---
    // Includes credentials to send session cookies and handles JSON/FormData
    async function fetchAPI(endpoint, options = {}) {
        options.credentials = 'include'; // Crucial for sending session cookies
        options.headers = {
            ...options.headers,
            // Set Content-Type only if body is JSON and NOT FormData
             ...(options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        };
        // Stringify body if it's a plain JS object (not FormData)
         if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
             options.body = JSON.stringify(options.body);
         }

        console.log(`[fetchAPI] Requesting: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            // Try to parse JSON, but handle potential non-JSON responses gracefully
            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                // Handle non-JSON responses (e.g., plain text error, HTML error page)
                const textResponse = await response.text();
                console.warn(`[fetchAPI] Received non-JSON response from ${endpoint}:`, textResponse);
                // If response was not OK, create an error object from the text
                if (!response.ok) {
                    result = { error: textResponse || `HTTP error! status: ${response.status}` };
                } else {
                    result = { message: textResponse }; // Treat as simple message if status was OK
                }
            }

            console.log(`[fetchAPI] Response Status from ${endpoint}: ${response.status}`);
            console.log(`[fetchAPI] Response Body from ${endpoint}:`, result);


            if (!response.ok) {
                // Use error message from parsed JSON/text or default HTTP status
                throw new Error(result.error || response.statusText || `HTTP error! status: ${response.status}`);
            }
            return result; // Return parsed JSON data or simple message object on success
        } catch (error) {
            console.error(`[fetchAPI] Error (${endpoint}):`, error);
            // Re-throw the error to be caught by the calling function
            throw error;
        }
    }

     // --- Helper: Show Feedback Message ---
    function showFeedback(element, message, type = 'error', duration = 4000) {
        if (!element) return;
        element.textContent = message;
        // Use Tailwind classes for styling (ensure these exist in settings.html)
        element.classList.remove('success', 'error', 'hidden'); // Clear previous states
        element.classList.add(type); // Add current state class
        element.style.display = 'block'; // Make visible

        // Auto-hide after duration (if duration > 0)
        if (duration > 0) {
            setTimeout(() => {
                // Check if the element still has the same type class before hiding
                // Prevents hiding if a new message of the same type appeared quickly
                if (element.classList.contains(type)) {
                    element.style.display = 'none';
                    element.classList.remove(type);
                }
            }, duration);
        }
    }

     // --- Helper: Set Button Loading State ---
     function setButtonLoading(button, textElement, spinnerElement, isLoading, defaultText) {
         if (!button || !textElement || !spinnerElement) return;
         button.disabled = isLoading;
         textElement.textContent = isLoading ? 'Processing...' : defaultText;
         if (isLoading) {
             spinnerElement.classList.remove('hidden');
         } else {
             spinnerElement.classList.add('hidden');
         }
     }


    // --- Load Initial Profile Data ---
    async function loadProfileData() {
        console.log("[loadProfileData] Attempting to fetch profile...");
        try {
            const profile = await fetchAPI('/api/profile'); // GET request by default

            console.log("[loadProfileData] Profile data received:", profile);

            if (displayNameInput) displayNameInput.value = profile.display_name || '';
            if (emailDisplayInput) emailDisplayInput.value = profile.email || ''; // Display email

            // --- Update Avatar Preview ---
            if (avatarPreview && avatarPlaceholder) {
                 const avatarUrlFromServer = profile.avatar_url;
                 console.log(`[loadProfileData] Avatar URL from server: ${avatarUrlFromServer}`);

                 if (avatarUrlFromServer) {
                     // Check if the URL is relative (starts with '/') or absolute
                     let fullAvatarUrl;
                     if (avatarUrlFromServer.startsWith('/')) {
                         // Prepend API base URL if it's a relative path
                         fullAvatarUrl = `${API_BASE_URL}${avatarUrlFromServer}`;
                     } else {
                         // Assume it's already an absolute URL (less likely with current server setup)
                         fullAvatarUrl = avatarUrlFromServer;
                     }
                     console.log(`[loadProfileData] Constructed full avatar URL: ${fullAvatarUrl}`);

                     avatarPreview.src = fullAvatarUrl; // Set the src of the <img> tag
                     avatarPreview.classList.remove('hidden'); // Show image
                     avatarPlaceholder.classList.add('hidden'); // Hide placeholder

                     // Handle image loading errors (e.g., 404 if file deleted or path wrong)
                     avatarPreview.onerror = () => {
                         console.warn(`[loadProfileData] Failed to load avatar image from ${fullAvatarUrl}. Showing placeholder.`);
                         avatarPreview.classList.add('hidden'); // Hide broken image
                         avatarPlaceholder.classList.remove('hidden'); // Show placeholder
                         showFeedback(avatarFeedback, 'Could not load avatar image.', 'error');
                     };
                      // Optional: Handle successful load
                      avatarPreview.onload = () => {
                          console.log(`[loadProfileData] Avatar image loaded successfully from ${fullAvatarUrl}.`);
                      };

                 } else {
                     // Show placeholder if no avatar URL is set in the profile
                     console.log("[loadProfileData] No avatar URL found in profile. Showing placeholder.");
                     avatarPreview.classList.add('hidden');
                     avatarPlaceholder.classList.remove('hidden');
                 }
            } else {
                console.warn("[loadProfileData] Avatar preview or placeholder element not found.");
            }

        } catch (error) {
            console.error("[loadProfileData] Failed to load profile data:", error);
            // Show error to user, check for unauthorized error specifically
            if (error.message.toLowerCase().includes('unauthorized') || error.message.includes('401')) {
                 showFeedback(profileFeedback, 'Session expired or invalid. Please log in again.', 'error', 0); // Don't auto-hide
                 // Optional redirect after delay
                 setTimeout(() => window.location.href = LOGIN_PAGE_URL, 3000);
            } else {
                 showFeedback(profileFeedback, `Error loading profile: ${error.message}`, 'error');
            }
            // Ensure avatar placeholder is shown on error loading profile
            if (avatarPreview && avatarPlaceholder) {
                avatarPreview.classList.add('hidden');
                avatarPlaceholder.classList.remove('hidden');
            }
        }
    }

    // --- Event Listener: Profile Form Submission (Display Name) ---
    if (profileForm && saveProfileButton) {
        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setButtonLoading(saveProfileButton, saveProfileText, saveProfileSpinner, true, 'Save Profile Changes');
            profileFeedback.style.display = 'none'; // Hide previous message

            const displayName = displayNameInput.value;

            try {
                const result = await fetchAPI('/api/profile', {
                    method: 'PUT',
                    body: { displayName } // Send only the display name
                });
                showFeedback(profileFeedback, result.message || 'Profile updated successfully!', 'success');
                // Optionally update any display name shown elsewhere on the page immediately
            } catch (error) {
                showFeedback(profileFeedback, error.message || 'Failed to update profile.', 'error');
                 // Check for unauthorized error specifically
                if (error.message.toLowerCase().includes('unauthorized') || error.message.includes('401')) {
                    setTimeout(() => window.location.href = LOGIN_PAGE_URL, 3000);
                }
            } finally {
                setButtonLoading(saveProfileButton, saveProfileText, saveProfileSpinner, false, 'Save Profile Changes');
            }
        });
    } else {
        console.warn("Profile form or save button not found.");
    }

    // --- Event Listener: Avatar Upload ---
    if (avatarUploadInput && avatarPreview) {
        avatarUploadInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) {
                console.log("[Avatar Upload] No file selected.");
                return; // No file selected
            }

            console.log("[Avatar Upload] File selected:", file.name, file.type, file.size);
            avatarFeedback.style.display = 'none'; // Hide previous message

            // Basic client-side validation
            if (!file.type.startsWith('image/')) {
                 showFeedback(avatarFeedback, 'Please select an image file (PNG, JPG, GIF, etc.).', 'error');
                 avatarUploadInput.value = ''; // Clear invalid selection
                 return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit (matches server)
                 showFeedback(avatarFeedback, 'File is too large (max 5MB).', 'error');
                 avatarUploadInput.value = ''; // Clear invalid selection
                 return;
            }

            // Use FormData to send the file
            const formData = new FormData();
            formData.append('avatar', file); // 'avatar' must match the name used in uploadAvatar.single('avatar') on server

            // Show temporary preview immediately (optional but good UX)
            const reader = new FileReader();
            reader.onload = (e) => {
                 avatarPreview.src = e.target.result; // Show preview
                 avatarPreview.classList.remove('hidden');
                 if(avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
            }
            reader.readAsDataURL(file);

            // Send the request
            try {
                showFeedback(avatarFeedback, 'Uploading avatar...', 'success', 0); // Indicate upload start (no auto-hide)
                const result = await fetchAPI('/api/profile/avatar', {
                    method: 'POST',
                    body: formData // Send FormData directly, fetch handles Content-Type
                });

                console.log("[Avatar Upload] API Response:", result);

                // Update preview with the final URL from the server IF PROVIDED and different
                // (Server currently sends relative URL)
                 if (result.avatarUrl) {
                     const finalAvatarUrl = result.avatarUrl.startsWith('/')
                         ? `${API_BASE_URL}${result.avatarUrl}`
                         : result.avatarUrl;

                     console.log(`[Avatar Upload] Setting final avatar src to: ${finalAvatarUrl}`);
                     avatarPreview.src = finalAvatarUrl; // Update src with the confirmed URL
                     // Re-add error handler for the new src
                     avatarPreview.onerror = () => {
                         console.warn(`[Avatar Upload] Failed to load newly uploaded avatar from ${finalAvatarUrl}.`);
                         if(avatarPlaceholder) {
                             avatarPreview.classList.add('hidden');
                             avatarPlaceholder.classList.remove('hidden');
                         }
                         showFeedback(avatarFeedback, 'Avatar uploaded, but failed to display.', 'error');
                     };
                     // Re-add success handler
                      avatarPreview.onload = () => {
                          console.log(`[Avatar Upload] Newly uploaded avatar loaded successfully from ${finalAvatarUrl}.`);
                      };

                 } else {
                     console.warn("[Avatar Upload] Server response did not include avatarUrl.");
                     // Keep the temporary preview or reload profile? Reloading might be safer.
                     // loadProfileData(); // Uncomment to reload profile data
                 }

                showFeedback(avatarFeedback, result.message || 'Avatar updated successfully!', 'success');

            } catch (error) {
                console.error("[Avatar Upload] Upload failed:", error);
                showFeedback(avatarFeedback, error.message || 'Failed to upload avatar.', 'error');
                 // Check for unauthorized error specifically
                if (error.message.toLowerCase().includes('unauthorized') || error.message.includes('401')) {
                    setTimeout(() => window.location.href = LOGIN_PAGE_URL, 3000);
                }
                 // Optional: Revert preview if upload fails? Or leave the temp preview?
                 // Consider reloading profile data to get the definite previous avatar state
                 // loadProfileData();
            } finally {
                 // Clear the file input value so the same file can be selected again if needed
                 avatarUploadInput.value = '';
            }
        });
    } else {
        console.warn("Avatar upload input or preview element not found.");
    }

     // --- Event Listener: Password Change Form Submission ---
     if (passwordForm && changePasswordButton) {
         passwordForm.addEventListener('submit', async (event) => {
             event.preventDefault();
             setButtonLoading(changePasswordButton, changePasswordText, changePasswordSpinner, true, 'Change Password');
             passwordFeedback.style.display = 'none'; // Hide previous message

             const currentPassword = currentPasswordInput.value;
             const newPassword = newPasswordInput.value;
             const confirmNewPassword = confirmNewPasswordInput.value;

             // Client-side validation
             if (!currentPassword || !newPassword || !confirmNewPassword) {
                 showFeedback(passwordFeedback, 'Please fill in all password fields.', 'error');
                 setButtonLoading(changePasswordButton, changePasswordText, changePasswordSpinner, false, 'Change Password');
                 return;
             }
             if (newPassword !== confirmNewPassword) {
                 showFeedback(passwordFeedback, 'New passwords do not match.', 'error');
                 setButtonLoading(changePasswordButton, changePasswordText, changePasswordSpinner, false, 'Change Password');
                 return;
             }
             if (newPassword.length < 8) {
                  showFeedback(passwordFeedback, 'New password must be at least 8 characters.', 'error');
                  setButtonLoading(changePasswordButton, changePasswordText, changePasswordSpinner, false, 'Change Password');
                  return;
             }
              if (currentPassword === newPassword) {
                  showFeedback(passwordFeedback, 'New password cannot be the same as the current one.', 'error');
                  setButtonLoading(changePasswordButton, changePasswordText, changePasswordSpinner, false, 'Change Password');
                  return;
              }

             try {
                 const result = await fetchAPI('/api/profile/password', {
                     method: 'PUT',
                     body: { currentPassword, newPassword }
                 });
                 showFeedback(passwordFeedback, result.message || 'Password changed successfully!', 'success');
                 passwordForm.reset(); // Clear form fields on success

             } catch (error) {
                 showFeedback(passwordFeedback, error.message || 'Failed to change password.', 'error');
                  // Check for unauthorized error specifically (e.g., incorrect current password)
                 if (error.message.toLowerCase().includes('unauthorized') || error.message.includes('401') || error.message.toLowerCase().includes('incorrect current password')) {
                    // Don't redirect, just show error
                 } else if (error.message.toLowerCase().includes('session expired')) {
                      // Handle potential session expiry during the process
                     setTimeout(() => window.location.href = LOGIN_PAGE_URL, 3000);
                 }
             } finally {
                 setButtonLoading(changePasswordButton, changePasswordText, changePasswordSpinner, false, 'Change Password');
             }
         });
     } else {
         console.warn("Password change form or button not found.");
     }

    // --- Event Listener: Logout Button ---
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
             logoutFeedback.style.display = 'none'; // Hide previous message
             // Optionally disable button while logging out
             logoutButton.disabled = true;
             logoutButton.textContent = 'Logging out...';
            try {
                await fetchAPI('/api/auth/logout', { method: 'POST' });
                showFeedback(logoutFeedback, 'Logged out successfully. Redirecting...', 'success', 0); // Don't auto-hide
                // Redirect to login page after successful logout
                window.location.href = LOGIN_PAGE_URL;
            } catch (error) {
                showFeedback(logoutFeedback, error.message || 'Logout failed. Please try again.', 'error');
                 // Re-enable button on error
                 logoutButton.disabled = false;
                 logoutButton.textContent = 'Log Out';
            }
        });
    } else {
        console.warn("Logout button not found.");
    }


    // --- Initial Load ---
    loadProfileData(); // Fetch profile data when the page loads

}); // End DOMContentLoaded
