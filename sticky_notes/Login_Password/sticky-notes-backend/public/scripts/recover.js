/**
 * Handles the submission of the password recovery form.
 * Sends the user's email to the backend API to request a password reset link.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the form and relevant elements
    const recoveryForm = document.getElementById('recoveryForm');
    const emailInput = document.getElementById('email');
    const messageDiv = document.getElementById('recoveryMessage'); // For success/error feedback
    const submitButton = document.getElementById('recoveryButton');
    const buttonText = document.getElementById('recoveryText');
    const buttonSpinner = document.getElementById('recoverySpinner');

    // --- Constants ---
    const API_BASE_URL = 'http://localhost:3000'; // Adjust if your server runs elsewhere

    // --- Event Listener for Form Submission ---
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            clearMessage(); // Clear previous messages
            setLoading(true); // Show loading state (shows spinner)

            const email = emailInput.value.trim();
            let isSuccess = false; // Flag to track if API call was logically successful

            // --- Client-Side Validation ---
            if (!email) {
                showMessage('Please enter your email address.', 'error');
                setLoading(false); // Stop loading on validation error
                return;
            }
            // Basic email format check
            if (!/\S+@\S+\.\S+/.test(email)) {
                showMessage('Please enter a valid email address.', 'error');
                setLoading(false); // Stop loading on validation error
                return;
            }

            // --- API Call ---
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/recover-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });

                // Try to parse JSON regardless of status code
                let result;
                try {
                    result = await response.json();
                } catch (jsonError) {
                    console.error("Failed to parse JSON response:", jsonError);
                    result = { error: `Server returned non-JSON response (Status: ${response.status})` };
                }


                if (!response.ok) {
                    // Throw an error to be caught by the catch block
                    throw new Error(result.error || response.statusText || `HTTP error! status: ${response.status}`);
                }

                // --- Success ---
                console.log('Password recovery requested:', result);
                // Show the success message (usually generic for security)
                showMessage(result.message || 'Password reset link sent successfully.', 'success');
                isSuccess = true;

                // Disable the form elements after success
                emailInput.disabled = true;
                submitButton.disabled = true; // Keep button disabled

                // *** FIX: Update button text AND hide spinner on success ***
                if(buttonText) buttonText.textContent = 'Link Sent';
                if(buttonSpinner) buttonSpinner.classList.add('hidden'); // Explicitly hide spinner

            } catch (error) {
                // --- Error Handling ---
                console.error('Password recovery failed:', error);
                // Display a user-friendly error message
                showMessage(error.message || 'Failed to send recovery link. Please check the email address and try again, or contact support if the problem persists.', 'error');
                isSuccess = false; // Explicitly mark as not successful

            } finally {
                // --- Loading State Cleanup ---
                // Only call setLoading(false) if there was an error,
                // because on success, we manually set the final state above.
                if (!isSuccess) {
                    setLoading(false); // This will hide spinner and re-enable button on error
                }
                // Defensive check: ensure spinner is hidden if button isn't disabled (error case)
                if (buttonSpinner && !submitButton.disabled) {
                     buttonSpinner.classList.add('hidden');
                }
            }
        });
    } else {
        console.error("Recovery form not found on this page.");
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
        // Remove previous type classes
        messageDiv.classList.remove('error', 'success');
        // Add the current type class (ensure these match your HTML styles)
        if (type === 'error' || type === 'success') {
            messageDiv.classList.add(type);
        }
        messageDiv.style.display = 'block'; // Make the message div visible
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
     * Sets the loading state of the submit button (shows/hides spinner).
     * @param {boolean} isLoading - True to set loading state, false otherwise.
     */
    function setLoading(isLoading) {
        if (submitButton && buttonText && buttonSpinner) {
            submitButton.disabled = isLoading;
            if (isLoading) {
                buttonText.textContent = 'Sending...';
                buttonSpinner.classList.remove('hidden'); // Show spinner
            } else {
                // Restore original text only if not successful (success handles its own text)
                if (buttonText.textContent === 'Sending...') { // Avoid overwriting "Link Sent"
                     buttonText.textContent = 'Send Reset Link';
                }
                buttonSpinner.classList.add('hidden'); // Hide spinner
            }
        }
    }
});
