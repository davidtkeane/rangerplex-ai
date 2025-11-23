/**
 * Handles the submission of the login form, password visibility toggle,
 * avatar preview and saving/loading, and particle animation initialization.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Get Form Elements ---
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('remember');
    const errorMessageDiv = document.getElementById('loginError');
    const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    const loginTextSpan = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    const togglePasswordButton = document.getElementById('togglePassword');
    const avatarUploadInput = document.getElementById('avatarUpload');
    const avatarPreviewImg = document.getElementById('avatarPreview'); // Target the img tag

    // --- Constants ---
    const API_BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on a different port/domain
    const LOGIN_SUCCESS_REDIRECT_URL = 'index.html'; // Change to your main app page (e.g., dashboard.html)
    const LOCAL_STORAGE_AVATAR_KEY = 'loginAvatar'; // Key for storing avatar in localStorage

    // --- Helper Functions ---

    /**
     * Displays an error message in the designated div.
     * @param {string} message - The error message to display.
     */
    function showError(message) {
        if (!errorMessageDiv) return;
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove('success');
        errorMessageDiv.classList.add('error');
        errorMessageDiv.style.display = 'block';
    }

    /**
     * Clears the error message div.
     */
    function clearError() {
         if (!errorMessageDiv) return;
         errorMessageDiv.textContent = '';
         errorMessageDiv.style.display = 'none';
         errorMessageDiv.classList.remove('error');
    }

    /**
     * Sets the loading state of the submit button.
     * @param {boolean} isLoading - True to set loading state, false otherwise.
     */
    function setLoading(isLoading) {
        if (submitButton && loginTextSpan && loginSpinner) {
            submitButton.disabled = isLoading;
            if (isLoading) {
                loginTextSpan.textContent = 'Authenticating...';
                loginSpinner.classList.remove('hidden');
            } else {
                loginTextSpan.textContent = 'Sign in';
                loginSpinner.classList.add('hidden');
            }
        }
    }

    /**
     * Initializes the particle animation background effect.
     */
    function initParticles() {
        const container = document.getElementById('particles');
        if (!container) {
             console.warn("Particle container not found.");
             return;
        }
        const particleCount = 30;
        container.innerHTML = ''; // Clear existing particles if any

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            const size = Math.random() * 3 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            const duration = Math.random() * 20 + 10;

            container.appendChild(particle);

            const moveParticle = () => {
                if (particle.parentElement) {
                    particle.style.transition = `all ${duration}s linear`; // Apply transition before changing position
                    particle.style.left = `${Math.random() * 100}%`;
                    particle.style.top = `${Math.random() * 100}%`;
                }
            };
            // Use setTimeout for the first move to allow initial render and apply transition
            setTimeout(moveParticle, Math.random() * 50); // Stagger initial moves slightly
            // Use a timer that restarts *after* the transition ends for smoother continuous movement
            particle.addEventListener('transitionend', moveParticle);
            // Initial call slightly delayed to ensure transition is set
            // setTimeout(moveParticle, 50);
        }
    }

    /**
     * Loads the saved avatar from localStorage, if available.
     */
    function loadSavedAvatar() {
        if (!avatarPreviewImg) return;
        try {
            const savedAvatarDataUrl = localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY);
            if (savedAvatarDataUrl) {
                console.log("Loading saved avatar from localStorage.");
                avatarPreviewImg.src = savedAvatarDataUrl;
                // Add error handling for the loaded image itself
                avatarPreviewImg.onerror = () => {
                    console.warn("Failed to load saved avatar image data. Resetting to default.");
                    localStorage.removeItem(LOCAL_STORAGE_AVATAR_KEY); // Remove invalid data
                    avatarPreviewImg.src = '/Volumes/KaliPro/Applications/Documents/Pictures/Tezos_Chip_v3.gif'; // Reset to placeholder
                    // avatarPreviewImg.src = 'https://placehold.co/96x96/374151/9ca3af?text=Avatar'; // Reset to placeholder
                    avatarPreviewImg.onerror = null; // Prevent infinite loop if placeholder fails
                };  
            } else {
                 console.log("No saved avatar found in localStorage.");
                 // Ensure the default placeholder is shown if nothing is saved
                 avatarPreviewImg.src = 'https://placehold.co/96x96/374151/9ca3af?text=Avatar';
            }
        } catch (error) {
            console.error("Error accessing localStorage for avatar:", error);
            // Fallback to default placeholder in case of storage errors
            avatarPreviewImg.src = 'https://placehold.co/96x96/374151/9ca3af?text=Avatar';
        }
    }

    /**
     * Sets up the event listener for avatar file input changes to show a preview
     * and save the avatar data to localStorage.
     */
    function setupAvatarPreviewAndSave() {
         if (avatarUploadInput && avatarPreviewImg) {
              avatarUploadInput.addEventListener('change', function(e) {
                 const file = e.target.files[0];
                 if (file) {
                     // Basic validation
                     if (!file.type.startsWith('image/')) {
                         console.warn("Selected file is not an image.");
                         showError("Please select an image file for the avatar.");
                         avatarUploadInput.value = ''; // Clear the input
                         return;
                     }
                     if (file.size > 5 * 1024 * 1024) { // 5MB limit example
                         console.warn("Selected file is too large.");
                         showError("Avatar image cannot exceed 5MB.");
                         avatarUploadInput.value = ''; // Clear the input
                         return;
                     }

                     clearError(); // Clear any previous errors
                     const reader = new FileReader();

                     reader.onload = function(event) {
                         const imageDataUrl = event.target.result;
                         // Set the src attribute of the existing img tag for preview
                         avatarPreviewImg.src = imageDataUrl;

                         // --- Save to localStorage ---
                         try {
                             localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, imageDataUrl);
                             console.log("Avatar saved to localStorage.");
                         } catch (error) {
                             console.error("Error saving avatar to localStorage:", error);
                             showError("Could not save avatar. Storage might be full.");
                             // Optionally revert preview if saving fails?
                             loadSavedAvatar(); // Revert to previously saved or default
                         }
                     };
                     // Handle potential read errors
                     reader.onerror = function() {
                         console.error("Error reading avatar file.");
                         showError("Could not read the selected avatar file.");
                         // Optionally reset to placeholder or previously saved
                         loadSavedAvatar();
                     };
                     reader.readAsDataURL(file);
                 }
             });
         } else {
             console.warn("Avatar preview elements not found (avatarUpload or avatarPreviewImg).");
         }
    }


    // --- Event Listener Setup ---

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearError();
            setLoading(true);

            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = rememberMeCheckbox.checked;
            let isSuccess = false;

            if (!email || !password) {
                showError('Please enter both email and password.');
                setLoading(false);
                return;
            }
             if (!/\S+@\S+\.\S+/.test(email)) {
                 showError('Please enter a valid email address.');
                 setLoading(false);
                 return;
             }

            try {
                console.log(`Attempting login for ${email}...`);
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                let result;
                try {
                    result = await response.json();
                } catch (jsonError) {
                    console.error("Failed to parse JSON response:", jsonError);
                    result = { error: `Server returned non-JSON response (Status: ${response.status} ${response.statusText})` };
                }

                if (!response.ok) {
                    console.error(`Login API Error: ${response.status}`, result);
                    throw new Error(result.error || `Login failed. Status: ${response.status}`);
                }

                console.log('Login successful:', result);
                isSuccess = true;

                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                    console.log("Email remembered.");
                } else {
                    localStorage.removeItem('rememberedEmail');
                    console.log("Remembered email cleared.");
                }

                // **Clear the locally saved avatar upon successful login**
                // You might want the avatar associated with the *account*,
                // which would be loaded *after* login, not persist from a previous local save.
                try {
                    localStorage.removeItem(LOCAL_STORAGE_AVATAR_KEY);
                    console.log("Cleared locally saved login avatar after successful login.");
                } catch (error) {
                    console.error("Could not clear local avatar storage:", error);
                }


                console.log(`Redirecting to ${LOGIN_SUCCESS_REDIRECT_URL}...`);
                window.location.href = LOGIN_SUCCESS_REDIRECT_URL;

            } catch (error) {
                console.error('Login failed:', error);
                showError(error.message || 'Login failed. Please check your credentials and try again.');
                isSuccess = false;
            } finally {
                 if (!isSuccess) {
                    setLoading(false);
                 }
            }
        });
    } else {
        console.error("Login form element not found.");
    }

    // Password Visibility Toggle
    if (togglePasswordButton && passwordInput) {
        togglePasswordButton.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ?
                `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>` :
                `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>`;
        });
    } else {
         console.warn("Password toggle button or password input not found.");
    }

    // --- Initial Setup ---

    // Pre-fill email if remembered
    if (emailInput && rememberMeCheckbox) {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            emailInput.value = rememberedEmail;
            rememberMeCheckbox.checked = true;
            console.log("Pre-filled remembered email.");
        }
    }

    // Initialize Particles
    initParticles();

    // Load Saved Avatar from localStorage
    loadSavedAvatar();

    // Setup Avatar Preview Listener (which also saves to localStorage)
    setupAvatarPreviewAndSave();

}); // End DOMContentLoaded
