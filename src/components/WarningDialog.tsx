import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface WarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    theme: 'dark' | 'light' | 'tron';
    isDangerous?: boolean;
}

export const WarningDialog: React.FC<WarningDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    theme,
    isDangerous = false,
}) => {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus on cancel button when dialog opens (safe default)
    useEffect(() => {
        if (isOpen) {
            const cancelButton = document.querySelector('.warning-cancel-btn') as HTMLButtonElement;
            if (cancelButton) {
                setTimeout(() => cancelButton.focus(), 100);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const dialogContent = (
        <div
            className={`modal-backdrop modal-backdrop-${theme}`}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="warning-title"
            aria-describedby="warning-message"
        >
            <div className={`warning-dialog warning-dialog-${theme}`}>
                {/* Warning Icon */}
                <div className="warning-icon">
                    <span className="icon-emoji">⚠️</span>
                </div>

                {/* Title */}
                <h2 id="warning-title" className="warning-title">
                    {title}
                </h2>

                {/* Message */}
                <p id="warning-message" className="warning-message">
                    {message}
                </p>

                {/* Buttons */}
                <div className="warning-buttons">
                    <button
                        className={`warning-btn warning-cancel-btn warning-cancel-btn-${theme}`}
                        onClick={onClose}
                        autoFocus
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`warning-btn warning-confirm-btn warning-confirm-btn-${theme} ${isDangerous ? 'dangerous' : ''
                            }`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(dialogContent, document.body);
};
