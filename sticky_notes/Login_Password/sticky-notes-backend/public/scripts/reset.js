/**
 * Handles the submission of the password reset form.
 * Extracts the reset token from the URL and sends it along with the new password
 * to the backend API.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the form and relevant elements
    const resetForm = document.getElementById('resetForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const messageDiv = document.getElementById('resetMessage');
    const submitButton = document.getElementById('resetButton');
    const buttonText = document.getElementById('resetText');
    const buttonSpinner = document.getElementById('resetSpinner');

    // --- Constants ---
    const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed
    const LOGIN_PAGE_URL = 'login_page.html'; // URL to redirect to after success

    // --- Get Token from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // Get the 'token' query parameter

    if (!token) {
        showMessage('Invalid or missing password reset token link. Please request a new link.', 'error');
        // Disable the form if token is missing
        if(resetForm) resetForm.style.pointerEvents = 'none'; // Disable form interaction
        if(submitButton) submitButton.disabled = true;
        if(buttonText) buttonText.textContent = 'Invalid Link';
    }

    // --- Event Listener for Form Submission ---
    if (resetForm && token) { // Only add listener if form and token exist
        resetForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            clearMessage(); // Clear previous messages
            setLoading(true); // Show loading state

            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            let isSuccess = false; // Flag for success

            // --- Client-Side Validation ---
            if (!password || !confirmPassword) {
                showMessage('Please enter and confirm your new password.', 'error');
                setLoading(false); // Stop loading on validation error
                return;
            }
            if (password !== confirmPassword) {
                showMessage('Passwords do not match.', 'error');
                setLoading(false); // Stop loading on validation error
                return;
            }
            if (password.length < 8) {
                showMessage('Password must be at least 8 characters long.', 'error');
                setLoading(false); // Stop loading on validation error
                return;
            }

            // --- API Call ---
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Send both the token and the new password
                    body: JSON.stringify({ token, password }),
                });

                let result;
                 try {
                     result = await response.json();
                 } catch (jsonError) {
                     console.error("Failed to parse JSON response:", jsonError);
                     result = { error: `Server returned non-JSON response (Status: ${response.status})` };
                 }


                if (!response.ok) {
                    // Use error message from server response if available
                    throw new Error(result.error || response.statusText || `HTTP error! status: ${response.status}`);
                }

                // --- Success ---
                console.log('Password reset successful:', result);
                showMessage(result.message || 'Password reset successfully! Redirecting to login...', 'success');
                isSuccess = true;

                // Disable form elements after success
                passwordInput.disabled = true;
                confirmPasswordInput.disabled = true;
                submitButton.disabled = true;
                buttonText.textContent = 'Password Reset!'; // Update button text

                // Redirect to login page after a delay
                setTimeout(() => {
                    window.location.href = LOGIN_PAGE_URL; // Redirect to login
                }, 3000); // 3-second delay

            } catch (error) {
                // --- Error Handling ---
                console.error('Password reset failed:', error);
                // Provide specific feedback if possible (e.g., token expired)
                let userMessage = 'Failed to reset password. Please try requesting a new link.';
                if (error.message && (error.message.toLowerCase().includes('invalid or expired') || error.message.toLowerCase().includes('token'))) {
                    userMessage = 'Password reset failed. The link may be invalid or expired. Please request a new link.';
                } else if (error.message) {
                     userMessage = error.message; // Show server error if available
                }
                showMessage(userMessage, 'error');
                isSuccess = false;
            } finally {
                // --- Loading State ---
                // Stop loading only if not successful (success handles its own state)
                if (!isSuccess) {
                    setLoading(false);
                }
                 // Ensure spinner is hidden if loading stopped
                 if (buttonSpinner && !submitButton.disabled) {
                      buttonSpinner.classList.add('hidden');
                 }
            }
        });
    } else if (!token) {
         console.error("Reset form event listener not added due to missing token.");
    } else {
        console.error("Reset form not found on this page.");
    }

    // --- Helper Functions ---

    /**
     * Displays a message (error or success) in the designated div.
     * Uses Tailwind classes defined in the HTML.
     * @param {string} message - The message to display.
     * @param {'error' | 'success'} type - The type of message.
     */
    function showMessage(message, type) {
        if (!messageDiv) return;
        messageDiv.textContent = message;
        messageDiv.classList.remove('error', 'success');
        if (type === 'error' || type === 'success') {
            messageDiv.classList.add(type); // Ensure these classes exist in your CSS/HTML
        }
        messageDiv.style.display = 'block';
    }

    /**
     * Clears any existing messages.
     */
    function clearMessage() {
        if (!messageDiv) return;
        messageDiv.textContent = '';
        messageDiv.style.display = 'none';
        messageDiv.classList.remove('error', 'success');
    }

    /**
     * Sets the loading state of the submit button.
     * @param {boolean} isLoading - True to set loading state, false otherwise.
     */
    function setLoading(isLoading) {
        if (submitButton && buttonText && buttonSpinner) {
            submitButton.disabled = isLoading;
            if (isLoading) {
                buttonText.textContent = 'Resetting...';
                buttonSpinner.classList.remove('hidden');
            } else {
                // Restore original text only if not successful
                if (buttonText.textContent === 'Resetting...') {
                    buttonText.textContent = 'Reset Password';
                }
                buttonSpinner.classList.add('hidden');
            }
        }
    }
});
