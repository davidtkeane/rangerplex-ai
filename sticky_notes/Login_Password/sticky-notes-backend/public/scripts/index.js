/**
 * Handles logic for the main index/dashboard page, primarily logout
 * and potentially fetching user data for personalization.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const logoutButton = document.getElementById('logoutButton');
    const logoutFeedback = document.getElementById('logoutFeedback');
    const welcomeMessage = document.getElementById('welcomeMessage'); // Element for personalized message

    // --- Constants ---
    // API endpoints are now relative paths since HTML is served from the same origin
    const LOGOUT_API_ENDPOINT = '/api/auth/logout';
    const PROFILE_API_ENDPOINT = '/api/profile';
    const LOGIN_PAGE_URL = 'login_page.html'; // Redirect target on logout/session expiry

    // --- Helper: API Fetch Function (Simplified - assumes JSON) ---
    // Includes credentials to send session cookies
    async function fetchAPI(endpoint, options = {}) {
        options.credentials = 'include'; // Crucial for sending session cookies
        options.headers = {
            'Content-Type': 'application/json', // Assume JSON for simplicity here
            ...options.headers,
        };
        if (options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }

        console.log(`[fetchAPI - index] Requesting: ${options.method || 'GET'} ${endpoint}`);

        try {
            const response = await fetch(endpoint, options); // Use relative endpoint
            const result = await response.json(); // Assume JSON response

            console.log(`[fetchAPI - index] Response Status from ${endpoint}: ${response.status}`);
            console.log(`[fetchAPI - index] Response Body from ${endpoint}:`, result);

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            return result;
        } catch (error) {
            console.error(`[fetchAPI - index] Error (${endpoint}):`, error);
            // Check if error is due to non-JSON response and re-throw appropriately
            if (error instanceof SyntaxError) {
                 throw new Error("Received non-JSON response from server.");
            }
            throw error;
        }
    }

     // --- Helper: Show Feedback Message ---
    function showFeedback(element, message, type = 'error', duration = 4000) {
        if (!element) return;
        element.textContent = message;
        // Basic text-based feedback for simplicity in this example
        element.style.color = type === 'error' ? '#ef4444' : '#10b981'; // Red or Green
        element.style.display = 'inline'; // Show inline

        if (duration > 0) {
            setTimeout(() => {
                element.style.display = 'none';
                element.textContent = '';
            }, duration);
        }
    }

    // --- Fetch User Data for Welcome Message ---
    async function loadUserData() {
        if (!welcomeMessage) return; // Only run if element exists

        try {
            console.log("[loadUserData] Fetching profile for welcome message...");
            const profile = await fetchAPI(PROFILE_API_ENDPOINT); // GET request
            const name = profile.display_name || profile.email; // Use display name or email
            welcomeMessage.textContent = `Ready to start your next project, ${name}?`;
            console.log("[loadUserData] Welcome message updated.");
        } catch (error) {
            console.error("[loadUserData] Failed to load user data:", error);
            // Handle unauthorized error - likely means session expired before page load
            if (error.message.toLowerCase().includes('unauthorized') || error.message.includes('401')) {
                 console.log("[loadUserData] Session invalid, redirecting to login.");
                 window.location.href = LOGIN_PAGE_URL;
            } else {
                // Keep default message or show generic error
                welcomeMessage.textContent = 'Could not load user details.';
            }
        }
    }


    // --- Event Listener: Logout Button ---
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            if (logoutFeedback) logoutFeedback.style.display = 'none';
            logoutButton.disabled = true;
            // Add temporary visual indication if desired
            logoutButton.style.opacity = '0.7';

            console.log("[Logout] Attempting logout...");
            try {
                await fetchAPI(LOGOUT_API_ENDPOINT, { method: 'POST' });
                console.log("[Logout] Logout successful, redirecting...");
                // Redirect to login page
                window.location.href = LOGIN_PAGE_URL;
            } catch (error) {
                console.error("[Logout] Logout failed:", error);
                showFeedback(logoutFeedback, error.message || 'Logout failed.', 'error');
                logoutButton.disabled = false;
                logoutButton.style.opacity = '1';
            }
        });
    } else {
        console.warn("Logout button not found.");
    }

    // --- Initial Load ---
    loadUserData(); // Fetch user data on page load

}); // End DOMContentLoaded
