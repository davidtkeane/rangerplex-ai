import React, { useEffect, useRef } from 'react';
import RangerTerminal from '../../../components/Terminal/RangerTerminal';
import { X } from 'lucide-react';

export default function TerminalPopup() {
    const terminalRef = useRef(null);

    // Close window on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                window.close(); // Close the popup window
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)', // Transparent background
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #00ff9d',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Drag Handle */}
            <div style={{
                height: '24px',
                backgroundColor: 'rgba(0, 255, 157, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                cursor: 'move',
                WebkitAppRegion: 'drag' // Electron drag region
            } as any}>
                <span style={{ fontSize: '12px', color: '#00ff9d', fontWeight: 'bold' }}>
                    RangerPlex Terminal
                </span>
                <X
                    size={14}
                    color="#00ff9d"
                    style={{ cursor: 'pointer', WebkitAppRegion: 'no-drag' } as any}
                    onClick={() => window.close()}
                />
            </div>

            {/* Terminal Content */}
            <div style={{ flex: 1, padding: '8px' }}>
                <RangerTerminal ref={terminalRef} />
            </div>
        </div>
    );
}
