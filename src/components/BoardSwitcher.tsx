import React, { useState, useEffect, useRef } from 'react';
import { BackgroundType } from '../hooks/useCanvasBackground';

interface Board {
    id: string;
    name: string;
    background: BackgroundType;
    created: number;
    modified: number;
}

interface BoardSwitcherProps {
    boards: Board[];
    currentBoardId: string;
    onSwitchBoard: (boardId: string) => void;
    onDeleteBoard: (boardId: string) => void;
    theme: 'dark' | 'light' | 'tron';
}

const BACKGROUND_ICONS: Record<BackgroundType, string> = {
    blank: '⬜',
    grid: '🔲',
    lines: '📝',
    dots: '⚫',
    graph: '📊',
};

export const BoardSwitcher: React.FC<BoardSwitcherProps> = ({
    boards,
    currentBoardId,
    onSwitchBoard,
    onDeleteBoard,
    theme,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const currentBoard = boards.find(b => b.id === currentBoardId);
    if (!currentBoard) return null;

    // Sort boards: Active first, then by last modified
    const sortedBoards = [...boards].sort((a, b) => {
        if (a.id === currentBoardId) return -1;
        if (b.id === currentBoardId) return 1;
        return b.modified - a.modified;
    });

    const handleSwitchBoard = (boardId: string) => {
        if (boardId !== currentBoardId) {
            onSwitchBoard(boardId);
        }
        setIsOpen(false);
    };

    const handleDeleteBoard = (e: React.MouseEvent, boardId: string) => {
        e.stopPropagation();
        onDeleteBoard(boardId);
        setIsOpen(false);
    };

    const formatTimeAgo = (timestamp: number): string => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const canDelete = boards.length > 1;

    return (
        <div className={`board-switcher board-switcher-${theme}`} ref={dropdownRef}>
            {/* Dropdown Button */}
            <button
                className={`switcher-btn switcher-btn-${theme} ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Switch board"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <span className="board-icon">
                    {BACKGROUND_ICONS[currentBoard.background]}
                </span>
                <span className="board-name">{currentBoard.name}</span>
                <span className={`dropdown-arrow ${isOpen ? 'up' : 'down'}`}>
                    {isOpen ? '▲' : '▼'}
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`switcher-dropdown switcher-dropdown-${theme}`}>
                    <div className="dropdown-header">
                        <span className="dropdown-title">Your Boards</span>
                        <span className="board-count">{boards.length}/10</span>
                    </div>

                    <div className="dropdown-list">
                        {sortedBoards.map((board) => (
                            <div
                                key={board.id}
                                className={`board-item board-item-${theme} ${board.id === currentBoardId ? 'active' : ''
                                    }`}
                                onClick={() => handleSwitchBoard(board.id)}
                                onMouseEnter={() => setHoveredBoardId(board.id)}
                                onMouseLeave={() => setHoveredBoardId(null)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Switch to ${board.name}`}
                            >
                                {/* Board Info */}
                                <div className="board-info">
                                    <div className="board-main">
                                        <span className="board-icon-small">
                                            {BACKGROUND_ICONS[board.background]}
                                        </span>
                                        <span className="board-name-text">{board.name}</span>
                                        {board.id === currentBoardId && (
                                            <span className="active-indicator" title="Active board">
                                                ⭐
                                            </span>
                                        )}
                                    </div>
                                    <div className="board-meta">
                                        <span className="last-modified">
                                            Last modified: {formatTimeAgo(board.modified)}
                                        </span>
                                    </div>
                                </div>

                                {/* Delete Button (only show if 2+ boards and on hover) */}
                                {canDelete && hoveredBoardId === board.id && (
                                    <button
                                        className={`delete-btn delete-btn-${theme}`}
                                        onClick={(e) => handleDeleteBoard(e, board.id)}
                                        title="Delete board"
                                        aria-label={`Delete ${board.name}`}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
