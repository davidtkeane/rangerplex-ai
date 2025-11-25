import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BackgroundType } from '../hooks/useCanvasBackground';

interface BoardCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateBoard: (background: BackgroundType, name?: string, color?: 'black' | 'gray' | 'white') => void;
    theme: 'dark' | 'light' | 'tron';
    maxBoardsReached: boolean;
    currentBoardCount: number;
}

const BACKGROUND_OPTIONS: Array<{
    type: BackgroundType;
    icon: string;
    label: string;
}> = [
        { type: 'blank', icon: '⬜', label: 'Blank' },
        { type: 'grid', icon: '🔲', label: 'Grid' },
        { type: 'lines', icon: '📝', label: 'Lines' },
        { type: 'dots', icon: '⚫', label: 'Dots' },
        { type: 'graph', icon: '📊', label: 'Graph' },
    ];

export const BoardCreationModal: React.FC<BoardCreationModalProps> = ({
    isOpen,
    onClose,
    onCreateBoard,
    theme,
    maxBoardsReached,
    currentBoardCount,
}) => {
    const [selectedBackground, setSelectedBackground] = useState<BackgroundType>('blank');
    const [selectedColor, setSelectedColor] = useState<'black' | 'gray' | 'white'>('white');
    const [boardName, setBoardName] = useState('');

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

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedBackground('blank');
            setSelectedColor('white'); // Default to white
            setBoardName('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleCreate = () => {
        if (maxBoardsReached) return;
        onCreateBoard(selectedBackground, boardName.trim() || undefined, selectedColor);
        onClose();
    };

    // Generate auto-name preview
    const getAutoName = (): string => {
        if (boardName.trim()) return boardName.trim();

        const bgLabel = BACKGROUND_OPTIONS.find(bg => bg.type === selectedBackground)?.label || 'Board';
        // This is just a preview - actual counting logic is in Claude's code
        return `${bgLabel} Board ${currentBoardCount + 1}`;
    };

    const modalContent = (
        <div
            className={`modal-backdrop modal-backdrop-${theme}`}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className={`board-creation-modal board-creation-modal-${theme}`}>
                {/* Header */}
                <div className="modal-header">
                    <h2 id="modal-title">Create New Board</h2>
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    {/* Max boards warning */}
                    {maxBoardsReached && (
                        <div className="modal-error">
                            ⚠️ Maximum 10 boards reached. Delete a board first.
                        </div>
                    )}

                    {/* Background type selector */}
                    <div className="background-selector">
                        <label className="selector-label">Choose Pattern:</label>
                        <div className="background-options">
                            {BACKGROUND_OPTIONS.map(({ type, icon, label }) => (
                                <button
                                    key={type}
                                    className={`bg-option ${selectedBackground === type ? 'active' : ''}`}
                                    onClick={() => setSelectedBackground(type)}
                                    disabled={maxBoardsReached}
                                    title={label}
                                    aria-label={`Pattern: ${label}`}
                                    aria-pressed={selectedBackground === type}
                                >
                                    <span className="bg-icon">{icon}</span>
                                    <span className="bg-label">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Background Color Selector */}
                    <div className="background-selector">
                        <label className="selector-label">Choose Color:</label>
                        <div className="background-options" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            {[
                                { value: 'black', label: 'Black', color: '#000000', border: '#333' },
                                { value: 'gray', label: 'Gray', color: '#808080', border: '#666' },
                                { value: 'white', label: 'White', color: '#ffffff', border: '#ccc' }
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`bg-option ${selectedColor === opt.value ? 'active' : ''}`}
                                    onClick={() => setSelectedColor(opt.value as any)}
                                    disabled={maxBoardsReached}
                                    style={{
                                        backgroundColor: opt.color,
                                        borderColor: selectedColor === opt.value ? '#0ea5e9' : opt.border,
                                        color: opt.value === 'white' ? '#000' : '#fff'
                                    }}
                                >
                                    <span className="bg-label">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional board name input */}
                    <div className="board-name-input">
                        <label htmlFor="board-name" className="input-label">
                            Board Name (Optional):
                        </label>
                        <input
                            id="board-name"
                            type="text"
                            className={`name-input name-input-${theme}`}
                            placeholder="Board name (optional)"
                            value={boardName}
                            onChange={(e) => setBoardName(e.target.value)}
                            maxLength={50}
                            disabled={maxBoardsReached}
                        />
                    </div>

                    {/* Preview */}
                    <div className="board-preview">
                        <span className="preview-label">Board will be named:</span>
                        <span className="preview-name">{getAutoName()}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        className={`modal-btn cancel-btn cancel-btn-${theme}`}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={`modal-btn create-btn create-btn-${theme}`}
                        onClick={handleCreate}
                        disabled={maxBoardsReached}
                    >
                        Create Board
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};
