import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'rangerplex_canvas_autosave';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const useCanvasStorage = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    autoSave: boolean = true
) => {
    const autoSaveTimerRef = useRef<NodeJS.Timeout>();
    const lastSaveRef = useRef<number>(0);

    /**
     * Save current canvas to localStorage as base64 PNG
     */
    const saveToLocalStorage = (): boolean => {
        if (!canvasRef.current) return false;

        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            localStorage.setItem(STORAGE_KEY, dataUrl);
            lastSaveRef.current = Date.now();
            console.log('✅ Canvas auto-saved to localStorage');
            return true;
        } catch (error) {
            console.error('❌ Failed to save canvas:', error);
            // Check if localStorage is full
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded! Please clear old canvases or download and delete current one.');
            }
            return false;
        }
    };

    /**
     * Load canvas from localStorage
     */
    const loadFromLocalStorage = (): boolean => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved || !canvasRef.current) return false;

        try {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (ctx && canvas) {
                    // Clear canvas first
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Draw loaded image
                    ctx.drawImage(img, 0, 0);
                    console.log('✅ Canvas loaded from localStorage');
                }
            };
            img.onerror = () => {
                console.error('❌ Failed to load saved canvas image');
            };
            img.src = saved;
            return true;
        } catch (error) {
            console.error('❌ Failed to load canvas:', error);
            return false;
        }
    };

    /**
     * Download canvas as PNG file
     */
    const saveAsPNG = (filename?: string): void => {
        if (!canvasRef.current) return;

        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = filename || `rangerplex-canvas-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('✅ Canvas saved as PNG');
        } catch (error) {
            console.error('❌ Failed to save PNG:', error);
            alert('Failed to save canvas as PNG');
        }
    };

    /**
     * Download canvas as JPG file (smaller file size)
     */
    const saveAsJPG = (filename?: string, quality: number = 0.9): void => {
        if (!canvasRef.current) return;

        try {
            const dataUrl = canvasRef.current.toDataURL('image/jpeg', quality);
            const link = document.createElement('a');
            link.download = filename || `rangerplex-canvas-${Date.now()}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('✅ Canvas saved as JPG');
        } catch (error) {
            console.error('❌ Failed to save JPG:', error);
            alert('Failed to save canvas as JPG');
        }
    };

    /**
     * Clear saved canvas from localStorage
     */
    const clearSaved = (): void => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('✅ Saved canvas cleared from localStorage');
        } catch (error) {
            console.error('❌ Failed to clear saved canvas:', error);
        }
    };

    /**
     * Get storage usage info
     */
    const getStorageInfo = (): { used: number; available: number } => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const used = saved ? saved.length : 0;
            // localStorage limit is typically 5-10MB (varies by browser)
            const available = 5 * 1024 * 1024; // Assume 5MB limit
            return { used, available };
        } catch {
            return { used: 0, available: 0 };
        }
    };

    /**
     * Setup auto-save interval
     */
    useEffect(() => {
        if (autoSave) {
            autoSaveTimerRef.current = setInterval(() => {
                saveToLocalStorage();
            }, AUTO_SAVE_INTERVAL);

            // Cleanup on unmount
            return () => {
                if (autoSaveTimerRef.current) {
                    clearInterval(autoSaveTimerRef.current);
                }
            };
        }
    }, [autoSave]);

    return {
        saveToLocalStorage,
        loadFromLocalStorage,
        saveAsPNG,
        saveAsJPG,
        clearSaved,
        getStorageInfo,
        lastSaveTime: lastSaveRef.current
    };
};
