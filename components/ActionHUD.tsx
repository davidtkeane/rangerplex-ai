
import React, { useState } from 'react';
import { speakText } from '../services/voiceService';
import { downloadFile } from '../services/trainingService';
import { Feedback } from '../types';

interface ActionHUDProps {
    text: string;
    isUser: boolean;
    existingFeedback?: Feedback;
    onRegenerate?: () => void;
    onRate?: (rating: 'up' | 'down', reason?: string) => void;
}

const ActionHUD: React.FC<ActionHUDProps> = ({ text, isUser, existingFeedback, onRegenerate, onRate }) => {
    const [copied, setCopied] = useState(false);
    const [showReasonInput, setShowReasonInput] = useState(false);
    const [reason, setReason] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        downloadFile(text, 'message.md', 'text/markdown');
    };

    const handleRate = (rating: 'up' | 'down') => {
        if (rating === 'down') {
            setShowReasonInput(true);
            onRate?.('down', reason); // Initial rating
        } else {
            onRate?.('up');
            setShowReasonInput(false);
        }
    };

    const submitReason = () => {
        onRate?.('down', reason);
        setShowReasonInput(false);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Actions */}
                <ActionButton icon={copied ? "fa-check" : "fa-copy"} onClick={handleCopy} tooltip="Copy" />
                <ActionButton icon="fa-volume-high" onClick={() => speakText(text)} tooltip="Read Aloud" />
                <ActionButton icon="fa-download" onClick={handleDownload} tooltip="Download" />
                
                {!isUser && (
                    <>
                        <div className="w-[1px] h-4 bg-zinc-700 mx-1"></div>
                        <ActionButton 
                            icon="fa-thumbs-up" 
                            onClick={() => handleRate('up')} 
                            tooltip="Good Response" 
                            active={existingFeedback?.rating === 'up'}
                            activeColor="text-green-500"
                        />
                        <ActionButton 
                            icon="fa-thumbs-down" 
                            onClick={() => handleRate('down')} 
                            tooltip="Bad Response" 
                            active={existingFeedback?.rating === 'down'}
                            activeColor="text-red-500"
                        />
                        {onRegenerate && (
                            <ActionButton icon="fa-rotate-right" onClick={onRegenerate} tooltip="Regenerate" />
                        )}
                    </>
                )}
            </div>

            {/* Feedback Input */}
            {showReasonInput && (
                <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded border border-red-900/30 animate-pop-in w-full max-w-xs">
                    <input 
                        autoFocus
                        type="text" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        placeholder="What went wrong? (e.g. hallucination, lazy)" 
                        className="bg-transparent text-xs text-white outline-none flex-1 placeholder-zinc-600"
                        onKeyDown={(e) => e.key === 'Enter' && submitReason()}
                    />
                    <button onClick={submitReason} className="text-xs text-red-400 hover:text-white font-bold px-2">SEND</button>
                </div>
            )}
        </div>
    );
};

const ActionButton = ({ icon, onClick, tooltip, active, activeColor }: any) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className={`w-6 h-6 flex items-center justify-center rounded transition-colors
            ${active ? (activeColor || 'text-teal-500') : 'text-zinc-500 hover:text-teal-500 hover:bg-zinc-800'}
        `}
    >
        <i className={`fa-solid ${icon} text-xs`}></i>
    </button>
);

export default ActionHUD;
