
import React, { useState } from 'react';

interface ThinkingBlockProps {
  content: string;
  isTron?: boolean;
  isMatrix?: boolean;
}

const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content, isTron, isMatrix }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const borderColor = isTron ? 'border-tron-cyan' : isMatrix ? 'border-green-500' : 'border-zinc-600';
  const bgColor = isTron ? 'bg-black' : isMatrix ? 'bg-black' : 'bg-zinc-900';
  const textColor = isTron ? 'text-tron-cyan' : isMatrix ? 'text-green-400' : 'text-zinc-400';
  const accentColor = isTron ? 'text-tron-orange' : isMatrix ? 'text-green-500' : 'text-teal-500';

  return (
    <div className={`mb-4 rounded-lg overflow-hidden border border-opacity-30 ${borderColor} ${bgColor}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors ${isTron ? 'hover:bg-tron-cyan/10' : 'hover:bg-white/5'} ${textColor}`}
      >
         <div className="flex items-center gap-2">
            <i className={`fa-solid fa-microchip ${accentColor} ${content.length > 0 ? '' : 'animate-pulse'}`}></i>
            <span>Thinking Process</span>
         </div>
         <i className={`fa-solid fa-chevron-down transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
      </button>
      
      {isExpanded && (
        <div className={`p-4 border-t border-opacity-20 text-xs font-mono leading-relaxed whitespace-pre-wrap animate-fade-in ${borderColor} ${textColor} opacity-80`}>
            {content || <span className="animate-pulse">Initializing Logic Circuits...</span>}
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
