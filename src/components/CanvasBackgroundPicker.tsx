import React from 'react';
import { BackgroundType } from '../hooks/useCanvasBackground';

interface BackgroundPickerProps {
    currentBackground: BackgroundType;
    onChange: (bg: BackgroundType) => void;
    theme: 'dark' | 'light' | 'tron';
    disabled?: boolean;
}

const BACKGROUNDS: Array<{ value: BackgroundType; label: string; icon: string }> = [
    { value: 'blank', label: 'Blank', icon: '⬜' },
    { value: 'grid', label: 'Grid', icon: '🔲' },
    { value: 'lines', label: 'Lines', icon: '📝' },
    { value: 'dots', label: 'Dots', icon: '⚫' },
    { value: 'graph', label: 'Graph', icon: '📊' }
];

export const CanvasBackgroundPicker: React.FC<BackgroundPickerProps> = ({
    currentBackground,
    onChange,
    theme,
    disabled = false
}) => {
    return (
        <div className={`bg-picker-container bg-picker-container-${theme}`}>
            <span className="bg-picker-label">
                Background: {disabled && <span title="Background locked. Create new board to change." style={{ marginLeft: '0.5rem' }}>🔒</span>}
            </span>
            <div className="bg-picker-buttons">
                {BACKGROUNDS.map(({ value, label, icon }) => (
                    <button
                        key={value}
                        className={`bg-picker-btn ${currentBackground === value ? 'active' : ''}`}
                        onClick={() => !disabled && onChange(value)}
                        title={disabled ? 'Background locked. Create new board to change.' : label}
                        aria-label={`Background: ${label}`}
                        disabled={disabled}
                        style={{
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {icon}
                    </button>
                ))}
            </div>
        </div>
    );
};
