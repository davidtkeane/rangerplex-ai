/**
 * Handles the submission of the registration form.
 * Sends user credentials to the backend API for account creation and triggers email verification.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get references (ensure these IDs match your new_account.html)
    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const messageDiv = document.getElementById('errorMessage'); // Use this for feedback
    const submitButton = registerForm.querySelector('button[type="submit"]');

    // --- Constants ---
    const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed

    // --- Event Listener for Form Submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            clearMessage();
            setLoading(true);

            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // --- Client-Side Validation ---
            if (!email || !password || !confirmPassword) {
                showMessage('Please fill in all fields.', 'error'); setLoading(false); return;
            }
            if (password !== confirmPassword) {
                showMessage('Passwords do not match.', 'error'); setLoading(false); return;
            }
            if (password.length < 8) {
                 showMessage('Password must be at least 8 characters long.', 'error'); setLoading(false); return;
            }
            if (!/\S+@\S+\.\S+/.test(email)) {
                 showMessage('Please enter a valid email address.', 'error'); setLoading(false); return;
            }

            // --- API Call ---
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();

                if (!response.ok) {
                    // Use specific error from server if available
                     throw new Error(result.error || `HTTP error! status: ${response.status}`);
                }

                // --- Success ---
                console.log('Registration submitted:', result);
                registerForm.reset(); // Clear the form
                // *** Updated Success Message ***
                showMessage(result.message || 'Account created! Please check your email to verify your account.', 'success');
                // Disable button after success to prevent resubmission
                if(submitButton) submitButton.disabled = true;


            } catch (error) {
                // --- Error Handling ---
                console.error('Registration failed:', error);
                showMessage(error.message || 'Registration failed. Please try again.', 'error');
            } finally {
                 // Stop loading unless button was disabled on success
                 if (!submitButton || !submitButton.disabled) {
                    setLoading(false);
                 }
            }
        });
    } else {
        console.error("Registration form not found.");
    }

    // --- Helper Functions ---
    function showMessage(message, type) {
        if (!messageDiv) return;
        messageDiv.textContent = message;
        messageDiv.classList.remove('error', 'success'); // Clear previous styles if any
        messageDiv.style.color = type === 'success' ? '#10b981' : '#ef4444'; // Green for success, Red for error
        messageDiv.style.backgroundColor = type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        // Add padding/border-radius if needed (might be handled by existing CSS)
        messageDiv.style.padding = '0.5rem';
        messageDiv.style.borderRadius = '0.375rem';
        messageDiv.style.marginTop = '1rem';
        messageDiv.style.display = 'block';
    }

    function clearMessage() {
        if (!messageDiv) return;
        messageDiv.textContent = '';
        messageDiv.style.display = 'none';
    }

    function setLoading(isLoading) {
        if (submitButton) {
            submitButton.disabled = isLoading;
            // Assuming the button only contains text
            submitButton.textContent = isLoading ? 'Creating Account...' : 'Create Account';
            // If using spinner inside button, adjust accordingly
        }
    }
});
