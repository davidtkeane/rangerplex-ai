// Accessibility Features for Neurodiverse Users
// This module adds ADHD, Dyslexia, and Autism support features

class AccessibilityManager {
    constructor() {
        this.preferences = this.loadPreferences();
        this.hyperfocusMode = false;
        this.cognitiveLoad = 0;
        this.sessionTimers = new Map();
        this.init();
    }

    init() {
        this.setupKeyboardShortcuts();
        this.createAccessibilityPanel();
        this.applyStoredPreferences();
    }

    // Load user preferences from localStorage
    loadPreferences() {
        const stored = localStorage.getItem('accessibility_preferences');
        return stored ? JSON.parse(stored) : {
            hyperfocusMode: false,
            dyslexicFont: false,
            reducedAnimations: false,
            simplifiedView: false,
            soundEnabled: true,
            timeAwareness: true,
            colorMeanings: true
        };
    }

    // Save preferences
    savePreferences() {
        localStorage.setItem('accessibility_preferences', JSON.stringify(this.preferences));
    }

    // 1. HYPERFOCUS MODE - Fade everything except active note
    toggleHyperfocusMode(activeNoteId = null) {
        this.hyperfocusMode = !this.hyperfocusMode;
        const body = document.body;
        
        if (this.hyperfocusMode) {
            body.classList.add('hyperfocus-mode');
            
            // Add CSS for hyperfocus
            if (!document.getElementById('hyperfocus-styles')) {
                const style = document.createElement('style');
                style.id = 'hyperfocus-styles';
                style.textContent = `
                    .hyperfocus-mode .note:not(.active-focus) {
                        opacity: 0.2 !important;
                        filter: blur(2px);
                        pointer-events: none;
                    }
                    .hyperfocus-mode .sidebar {
                        opacity: 0.1;
                    }
                    .hyperfocus-mode .active-focus {
                        box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
                        transform: scale(1.05);
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Mark active note if provided
            if (activeNoteId) {
                document.querySelectorAll('.note').forEach(note => {
                    note.classList.remove('active-focus');
                });
                const activeNote = document.getElementById(activeNoteId);
                if (activeNote) {
                    activeNote.classList.add('active-focus');
                }
            }
        } else {
            body.classList.remove('hyperfocus-mode');
            document.querySelectorAll('.note').forEach(note => {
                note.classList.remove('active-focus');
            });
        }
        
        this.preferences.hyperfocusMode = this.hyperfocusMode;
        this.savePreferences();
        this.showNotification(this.hyperfocusMode ? 'Hyperfocus Mode ON' : 'Hyperfocus Mode OFF');
    }

    // 2. DYSLEXIA FONT TOGGLE
    toggleDyslexicFont() {
        const body = document.body;
        this.preferences.dyslexicFont = !this.preferences.dyslexicFont;
        
        if (this.preferences.dyslexicFont) {
            // Add OpenDyslexic font
            if (!document.getElementById('dyslexic-font')) {
                const link = document.createElement('link');
                link.id = 'dyslexic-font';
                link.rel = 'stylesheet';
                link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
                document.head.appendChild(link);
            }
            
            // Apply dyslexia-friendly styles
            if (!document.getElementById('dyslexia-styles')) {
                const style = document.createElement('style');
                style.id = 'dyslexia-styles';
                style.textContent = `
                    .dyslexic-font {
                        font-family: 'OpenDyslexic', Arial, sans-serif !important;
                        letter-spacing: 0.12em !important;
                        word-spacing: 0.16em !important;
                        line-height: 1.8 !important;
                    }
                    .dyslexic-font .note-content {
                        font-size: 16px !important;
                        background-color: #fffef5;
                        color: #1a1a1a;
                    }
                `;
                document.head.appendChild(style);
            }
            
            body.classList.add('dyslexic-font');
        } else {
            body.classList.remove('dyslexic-font');
        }
        
        this.savePreferences();
        this.showNotification(this.preferences.dyslexicFont ? 'Dyslexic Font ON' : 'Dyslexic Font OFF');
    }

    // 3. PANIC BUTTON - Simplify everything immediately
    activatePanicMode() {
        // Save current state
        sessionStorage.setItem('pre-panic-state', JSON.stringify({
            scrollPosition: window.scrollY,
            activeNote: document.querySelector('.active-focus')?.id
        }));
        
        // Clear everything except most important
        document.body.classList.add('panic-mode');
        
        // Add panic mode styles
        if (!document.getElementById('panic-styles')) {
            const style = document.createElement('style');
            style.id = 'panic-styles';
            style.textContent = `
                .panic-mode {
                    background: #f0f0f0 !important;
                }
                .panic-mode .note {
                    display: none !important;
                }
                .panic-mode .note.pinned:first-child {
                    display: block !important;
                    position: fixed !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    width: 600px !important;
                    max-width: 90vw !important;
                    box-shadow: 0 0 50px rgba(0,0,0,0.1) !important;
                }
                .panic-mode .sidebar {
                    display: none !important;
                }
                .panic-recovery-btn {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 15px 30px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    cursor: pointer;
                    z-index: 9999;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add recovery button
        const recoveryBtn = document.createElement('button');
        recoveryBtn.className = 'panic-recovery-btn';
        recoveryBtn.textContent = 'Exit Panic Mode';
        recoveryBtn.onclick = () => this.exitPanicMode();
        document.body.appendChild(recoveryBtn);
        
        // Stop all animations
        document.getAnimations().forEach(animation => animation.pause());
        
        this.showNotification('Panic Mode Activated - Showing only priority task', 'info');
    }

    exitPanicMode() {
        document.body.classList.remove('panic-mode');
        const recoveryBtn = document.querySelector('.panic-recovery-btn');
        if (recoveryBtn) recoveryBtn.remove();
        
        // Restore previous state
        const savedState = sessionStorage.getItem('pre-panic-state');
        if (savedState) {
            const state = JSON.parse(savedState);
            window.scrollTo(0, state.scrollPosition);
        }
        
        this.showNotification('Returned to normal view', 'success');
    }

    // 4. TIME AWARENESS FOR ADHD
    startNoteTimer(noteId) {
        const startTime = Date.now();
        this.sessionTimers.set(noteId, {
            start: startTime,
            elapsed: 0
        });
        
        // Create timer display
        const note = document.getElementById(noteId);
        if (note) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'note-timer';
            timerDiv.id = `timer-${noteId}`;
            timerDiv.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
            `;
            note.appendChild(timerDiv);
            
            // Update timer every second
            const timerId = setInterval(() => {
                const session = this.sessionTimers.get(noteId);
                if (session) {
                    const elapsed = Math.floor((Date.now() - session.start) / 1000);
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = elapsed % 60;
                    timerDiv.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    // Gentle reminder after 25 minutes (Pomodoro)
                    if (elapsed === 1500 && this.preferences.timeAwareness) {
                        this.showNotification('25 minutes on this note - Consider a break?', 'info');
                    }
                } else {
                    clearInterval(timerId);
                }
            }, 1000);
        }
    }

    stopNoteTimer(noteId) {
        this.sessionTimers.delete(noteId);
        const timerDiv = document.getElementById(`timer-${noteId}`);
        if (timerDiv) timerDiv.remove();
    }

    // 5. COGNITIVE LOAD METER
    calculateCognitiveLoad() {
        let load = 0;
        
        // Count visible elements
        const visibleNotes = document.querySelectorAll('.note:not([style*="display: none"])').length;
        load += visibleNotes * 2;
        
        // Count active animations
        const animations = document.getAnimations().length;
        load += animations * 3;
        
        // Count different colors
        const colors = new Set();
        document.querySelectorAll('.note').forEach(note => {
            const bgColor = window.getComputedStyle(note).backgroundColor;
            colors.add(bgColor);
        });
        load += colors.size * 2;
        
        // Text density
        const totalText = Array.from(document.querySelectorAll('.note-content'))
            .reduce((sum, el) => sum + el.textContent.length, 0);
        load += Math.floor(totalText / 1000);
        
        this.cognitiveLoad = Math.min(load, 100);
        this.updateCognitiveLoadDisplay();
        
        // Auto-suggest simplification
        if (this.cognitiveLoad > 70) {
            this.suggestSimplification();
        }
    }

    updateCognitiveLoadDisplay() {
        let meter = document.getElementById('cognitive-load-meter');
        if (!meter) {
            meter = document.createElement('div');
            meter.id = 'cognitive-load-meter';
            meter.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                width: 200px;
                height: 20px;
                background: #e5e7eb;
                border-radius: 10px;
                overflow: hidden;
                z-index: 1000;
            `;
            document.body.appendChild(meter);
            
            const fill = document.createElement('div');
            fill.id = 'cognitive-load-fill';
            fill.style.cssText = `
                height: 100%;
                transition: width 0.3s ease;
                border-radius: 10px;
            `;
            meter.appendChild(fill);
            
            const label = document.createElement('div');
            label.id = 'cognitive-load-label';
            label.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                color: #374151;
            `;
            meter.appendChild(label);
        }
        
        const fill = document.getElementById('cognitive-load-fill');
        const label = document.getElementById('cognitive-load-label');
        
        fill.style.width = `${this.cognitiveLoad}%`;
        
        // Color based on load
        if (this.cognitiveLoad < 30) {
            fill.style.background = '#10b981'; // Green
            label.textContent = 'Low Load';
        } else if (this.cognitiveLoad < 70) {
            fill.style.background = '#f59e0b'; // Orange
            label.textContent = 'Moderate Load';
        } else {
            fill.style.background = '#ef4444'; // Red
            label.textContent = 'High Load!';
        }
    }

    suggestSimplification() {
        if (!document.getElementById('simplify-suggestion')) {
            const suggestion = document.createElement('div');
            suggestion.id = 'simplify-suggestion';
            suggestion.style.cssText = `
                position: fixed;
                top: 40px;
                right: 10px;
                background: #fef3c7;
                border: 1px solid #f59e0b;
                padding: 10px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1001;
                max-width: 250px;
            `;
            suggestion.innerHTML = `
                <strong>Feeling overwhelmed?</strong><br>
                <button onclick="accessibilityManager.simplifyView()" style="
                    margin-top: 5px;
                    padding: 5px 10px;
                    background: #f59e0b;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Simplify View</button>
                <button onclick="this.parentElement.remove()" style="
                    margin-left: 5px;
                    padding: 5px 10px;
                    background: #6b7280;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Dismiss</button>
            `;
            document.body.appendChild(suggestion);
            
            // Auto-remove after 10 seconds
            setTimeout(() => suggestion.remove(), 10000);
        }
    }

    simplifyView() {
        // Hide non-essential elements
        document.querySelectorAll('.note:not(.pinned)').forEach((note, index) => {
            if (index > 4) note.style.display = 'none';
        });
        
        // Reduce animations
        document.body.classList.add('reduced-motion');
        
        // Simplify colors
        document.body.classList.add('simplified-colors');
        
        this.preferences.simplifiedView = true;
        this.savePreferences();
        this.calculateCognitiveLoad();
        this.showNotification('View simplified', 'success');
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        let escapeCount = 0;
        let escapeTimer;
        
        document.addEventListener('keydown', (e) => {
            // Hyperfocus Mode: Cmd/Ctrl + H
            if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
                e.preventDefault();
                const activeNote = document.querySelector('.note:hover')?.id;
                this.toggleHyperfocusMode(activeNote);
            }
            
            // Dyslexic Font: Cmd/Ctrl + D
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleDyslexicFont();
            }
            
            // Panic Mode: Triple ESC
            if (e.key === 'Escape') {
                escapeCount++;
                clearTimeout(escapeTimer);
                
                if (escapeCount >= 3) {
                    this.activatePanicMode();
                    escapeCount = 0;
                } else {
                    escapeTimer = setTimeout(() => {
                        escapeCount = 0;
                    }, 500);
                }
            }
        });
    }

    // Create accessibility control panel
    createAccessibilityPanel() {
        const panel = document.createElement('div');
        panel.id = 'accessibility-panel';
        panel.className = 'fixed bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 999;
            display: none;
        `;
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Accessibility Options</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="hyperfocus-toggle" style="margin-right: 8px;">
                    Hyperfocus Mode (Cmd+H)
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="dyslexic-toggle" style="margin-right: 8px;">
                    Dyslexic Font (Cmd+D)
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="animations-toggle" style="margin-right: 8px;">
                    Reduce Animations
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="time-toggle" style="margin-right: 8px;">
                    Show Time Awareness
                </label>
                <button onclick="accessibilityManager.activatePanicMode()" style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">PANIC MODE (ESC x3)</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Add floating button to toggle panel
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'accessibility-toggle';
        toggleBtn.innerHTML = '♿';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #3b82f6;
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 998;
            transition: transform 0.2s;
        `;
        toggleBtn.onmouseover = () => toggleBtn.style.transform = 'scale(1.1)';
        toggleBtn.onmouseout = () => toggleBtn.style.transform = 'scale(1)';
        toggleBtn.onclick = () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (panel.style.display === 'block') {
                toggleBtn.style.display = 'none';
            }
        };
        
        document.body.appendChild(toggleBtn);
        
        // Wire up panel controls
        document.getElementById('hyperfocus-toggle').onchange = (e) => {
            if (e.target.checked !== this.hyperfocusMode) {
                this.toggleHyperfocusMode();
            }
        };
        
        document.getElementById('dyslexic-toggle').onchange = (e) => {
            if (e.target.checked !== this.preferences.dyslexicFont) {
                this.toggleDyslexicFont();
            }
        };
        
        document.getElementById('animations-toggle').onchange = (e) => {
            this.preferences.reducedAnimations = e.target.checked;
            document.body.classList.toggle('reduced-motion', e.target.checked);
            this.savePreferences();
        };
        
        document.getElementById('time-toggle').onchange = (e) => {
            this.preferences.timeAwareness = e.target.checked;
            this.savePreferences();
        };
        
        // Add close button to panel
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6b7280;
        `;
        closeBtn.onclick = () => {
            panel.style.display = 'none';
            toggleBtn.style.display = 'block';
        };
        panel.appendChild(closeBtn);
    }

    // Apply stored preferences on load
    applyStoredPreferences() {
        if (this.preferences.dyslexicFont) {
            this.toggleDyslexicFont();
            document.getElementById('dyslexic-toggle').checked = true;
        }
        
        if (this.preferences.reducedAnimations) {
            document.body.classList.add('reduced-motion');
            document.getElementById('animations-toggle').checked = true;
        }
        
        if (this.preferences.hyperfocusMode) {
            document.getElementById('hyperfocus-toggle').checked = true;
        }
        
        document.getElementById('time-toggle').checked = this.preferences.timeAwareness;
        
        // Start monitoring cognitive load
        setInterval(() => this.calculateCognitiveLoad(), 5000);
    }

    // Utility function to show notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        notification.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
}

// Initialize accessibility manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}