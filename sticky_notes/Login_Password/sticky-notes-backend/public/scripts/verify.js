/**
 * Handles email verification by sending the token from the URL to the backend.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Get references to elements
    const statusDiv = document.getElementById('verificationStatus');
    const loginLinkContainer = document.getElementById('loginLinkContainer');

    // --- Constants ---
    const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed

    // --- Get Token from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    /**
     * Updates the status message display.
     * @param {string} message - The message text.
     * @param {'loading' | 'success' | 'error'} type - The message type.
     */
    function updateStatus(message, type) {
        if (!statusDiv) return;
        // Clear previous classes and spinner
        statusDiv.classList.remove('loading', 'success', 'error');
        const spinner = statusDiv.querySelector('.spinner');
        if (spinner) spinner.style.display = 'none';

        // Set new message and class
        statusDiv.innerHTML = `<p>${message}</p>`; // Replace content
        statusDiv.classList.add(type);
        statusDiv.style.display = 'block';

        // Show login link on success
        if (type === 'success' && loginLinkContainer) {
            loginLinkContainer.style.display = 'block';
        }
    }

    // --- API Call ---
    if (!token) {
        updateStatus('Verification failed: Missing token in the link.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        // --- Success ---
        console.log('Email verification successful:', result);
        updateStatus(result.message || 'Email verified successfully!', 'success');

    } catch (error) {
        // --- Error Handling ---
        console.error('Email verification failed:', error);
        updateStatus(error.message || 'Email verification failed. The link might be invalid or expired.', 'error');
    }
});
