
import React, { useState, useEffect } from 'react';
import { Message, Sender, Currency } from '../types';
import SourceCard from './SourceCard';
import MermaidDiagram from './MermaidDiagram';
import { runPythonCode } from '../services/pyodideService';
import ThinkingBlock from './ThinkingBlock';
import SmartTable from './SmartTable';
import ActionHUD from './ActionHUD';
import ImageGallery from './ImageGallery';
import AudioPlayer from './AudioPlayer';
import ArtifactPreview from './ArtifactPreview';
import { calculateCost } from '../services/currencyService';

interface MessageItemProps {
  message: Message;
  userAvatar?: string;
  aiAvatar?: string;
  isTron?: boolean;
  isMatrix?: boolean;
  onRegenerate?: () => void;
  onRate?: (rating: 'up' | 'down', reason?: string) => void;
  onMakeNote?: (message: Message) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, userAvatar, aiAvatar, isTron, isMatrix, onRegenerate, onRate, onMakeNote }) => {
  const isUser = message.sender === Sender.USER;
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [userCurrency, setUserCurrency] = useState<Currency>('USD');

  const renderSourceLinks = (text: string) => {
      const parts = text.split(/(\[\d+\])/);
      return parts.map((part, idx) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
              const num = match[1];
              return (
                  <a
                      key={`src-${idx}`}
                      href={`#source-${message.id}-${num}`}
                      className={`underline decoration-dotted ${isTron ? 'text-tron-cyan' : isMatrix ? 'text-green-400' : 'text-teal-500'}`}
                  >
                      [{num}]
                  </a>
              );
          }
          return <React.Fragment key={`txt-${idx}`}>{part}</React.Fragment>;
      });
  };

  useEffect(() => {
      const stored = localStorage.getItem('perplex_active_user');
      if (stored) {
          const settings = localStorage.getItem(`perplex_settings_${stored}`);
          if (settings) {
              try {
                  const parsed = JSON.parse(settings);
                  if (parsed.currency) setUserCurrency(parsed.currency);
              } catch {}
          }
      }
  }, []);

  const handleRunCode = async (code: string) => {
      setIsRunning(true);
      setOutput(null);
      await new Promise(r => setTimeout(r, 100)); 
      try {
          const res = await runPythonCode(code);
          setOutput(res);
      } catch (e) {
          setOutput("Execution failed.");
      } finally {
          setIsRunning(false);
      }
  };

  const parseContent = (text: string) => {
      if (!text) return null;

      const parts: React.ReactNode[] = [];
      let cleanText = text;

      const thoughtMatch = cleanText.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thoughtMatch) {
          parts.push(<ThinkingBlock key="think" content={thoughtMatch[1].trim()} isTron={isTron} isMatrix={isMatrix} />);
          cleanText = cleanText.replace(thoughtMatch[0], '');
      }

      const codeSplit = cleanText.split(/```/);
      
      codeSplit.forEach((part, index) => {
          if (index % 2 === 1) {
              const lines = part.split('\n');
              const lang = lines[0].trim();
              const code = lines.slice(1).join('\n');

              if (lang === 'mermaid') {
                  parts.push(<MermaidDiagram key={index} code={code} />);
              } else {
                  parts.push(
                    <div key={index} className="my-4 rounded-lg overflow-hidden bg-black/50 border border-zinc-700 dark:border-zinc-700 border-opacity-50 group/code relative">
                        <div className="px-4 py-1 bg-zinc-800/50 text-xs text-zinc-400 border-b border-zinc-700 flex justify-between items-center">
                            <span className="font-mono">{lang}</span>
                            <div className="flex gap-2">
                                <button onClick={() => navigator.clipboard.writeText(code)} className="hover:text-white"><i className="fa-regular fa-copy"></i></button>
                                {(lang === 'python' || lang === 'py') && (
                                    <button onClick={() => handleRunCode(code)} disabled={isRunning} className="flex items-center gap-1 hover:text-white transition-colors text-teal-500">
                                        {isRunning ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-play"></i>} Run
                                    </button>
                                )}
                            </div>
                        </div>
                        <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 whitespace-pre-wrap">{code}</pre>
                        {output && (
                            <div className="border-t border-zinc-700 bg-zinc-900 p-3">
                                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Output</div>
                                <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{output}</pre>
                            </div>
                        )}
                    </div>
                  );
              }
          } else {
              if (part.trim().match(/^\|(.+)\|$/m)) {
                  const lines = part.trim().split('\n').filter(l => l.trim().startsWith('|'));
                  if (lines.length > 2) {
                      const headers = lines[0].split('|').map(c => c.trim()).filter(c => c);
                      const rows = lines.slice(2).map(row => row.split('|').map(c => c.trim()).filter(c => c)); 
                      parts.push(<SmartTable key={index} headers={headers} rows={rows} isTron={isTron} />);
                      return;
                  }
              }
              parts.push(
                 <div key={index} className="prose prose-invert prose-p:text-inherit prose-strong:text-inherit max-w-none">
                                {part.split('\n').map((line, i) => (
                                    <p key={`${index}-${i}`} className={`mb-2 leading-7 ${line.startsWith('- ') || line.startsWith('* ') ? 'pl-4' : ''}`}>
                                        {line.split(/(\*\*.*?\*\*)/).map((chunk, j) => {
                                            if (chunk.startsWith('**') && chunk.endsWith('**')) return <strong key={j} className="font-bold text-inherit opacity-100">{chunk.slice(2, -2)}</strong>;
                                            return <React.Fragment key={j}>{renderSourceLinks(chunk)}</React.Fragment>;
                                        })}
                                    </p>
                                ))}
                             </div>
              );
          }
      });

      return parts;
  };

  return (
    <div className={`flex gap-4 mb-6 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-white/10 ${isUser ? 'bg-zinc-800' : (message.agentColor || 'bg-teal-900')}`}>
        {isUser ? (
            userAvatar ? <img src={userAvatar} alt="User" className="w-full h-full object-cover" /> : <i className="fa-solid fa-user text-sm"></i>
        ) : (
            (message.agentName && aiAvatar) ? <img src={aiAvatar} alt={message.agentName} className="w-full h-full object-cover" /> :
            aiAvatar ? <img src={aiAvatar} alt="AI" className="w-full h-full object-cover" /> : 
            message.agentName ? <i className="fa-solid fa-paw text-sm"></i> :
            <i className="fa-solid fa-robot text-sm"></i>
        )}
      </div>

      <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
            <div className="font-bold">{isUser ? 'You' : (message.agentName || 'Ranger')}</div>
            {!isUser && message.agentName && (
                <span className={`px-2 py-[1px] rounded-full text-[9px] font-bold uppercase tracking-wider text-white ${message.agentColor || 'bg-zinc-600'}`}>{message.agentName}</span>
            )}
        </div>
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((att, idx) => (
                    <div key={idx} className="relative group rounded overflow-hidden border border-white/20 w-20 h-20 bg-black/30">
                        {att.mimeType.startsWith('image') ? (
                            <img src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" className="w-full h-full object-cover" />
                        ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center"><i className="fa-solid fa-file text-xl mb-1 opacity-70"></i></div>
                        )}
                    </div>
                ))}
            </div>
        )}

        <div className={`text-[15px] w-full ${isUser ? 'text-right' : 'text-left'}`}>
           {message.isThinking && !message.text ? (
              <div className={`flex items-center gap-2 animate-pulse ${isTron ? 'text-tron-cyan' : 'text-teal-500'}`}>
                <i className="fa-solid fa-square-full text-[8px] fa-spin"></i>
                <span className="text-sm font-mono uppercase tracking-widest">Processing</span>
              </div>
           ) : (
              <>
                {message.groundingSources && message.groundingSources.length > 0 && (
                    <div className="mb-4 bg-black/20 p-2 rounded border border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest opacity-50">
                            <i className="fa-solid fa-link"></i> Grounding
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {message.groundingSources.map((source, idx) => <SourceCard key={idx} source={source} index={idx} messageId={message.id} />)}
                        </div>
                    </div>
                )}
                
                {/* Generated Media */}
                {message.generatedImages && <ImageGallery images={message.generatedImages} />}
                {message.audioData && <AudioPlayer src={message.audioData.url} autoPlay />}
                {message.artifact && <ArtifactPreview artifact={message.artifact} />}
                
                {message.thoughtProcess && <ThinkingBlock content={message.thoughtProcess} isTron={isTron} isMatrix={isMatrix} />}
                {parseContent(message.text)}

                <div className="flex flex-col gap-1">
                    <ActionHUD text={message.text} isUser={isUser} existingFeedback={message.feedback} onRegenerate={!isUser ? onRegenerate : undefined} onRate={!isUser ? onRate : undefined} />
                    {onMakeNote && (
                        <div className="flex justify-center">
                            <button
                                onClick={() => onMakeNote(message)}
                                className={`text-[10px] px-2 py-1 rounded-full border ${isTron ? 'border-tron-cyan text-tron-cyan hover:bg-tron-cyan/20' : 'border-gray-300 text-gray-600 dark:text-zinc-200 hover:bg-yellow-300 hover:text-gray-900'}`}
                                title="Send to Study Notes"
                            >
                                <i className="fa-regular fa-note-sticky mr-1"></i> Make Note
                            </button>
                        </div>
                    )}
                </div>

                {message.stats && (
                    <div className={`mt-2 flex items-center gap-3 text-[9px] font-mono opacity-40 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span>{message.stats.model}</span>
                        <span>|</span>
                        <span>{message.stats.latencyMs}ms</span>
                        {(() => {
                            const inputTokens = typeof message.stats.inputTokens === 'number' ? message.stats.inputTokens : 0;
                            const outputTokens = typeof message.stats.outputTokens === 'number' ? message.stats.outputTokens : 0;
                            let totalTokens = inputTokens + outputTokens;
                            let estimated = false;

                            // Fallback: estimate tokens from AI message text if provider didn't return usage
                            if (totalTokens === 0 && message.text) {
                                totalTokens = Math.max(1, Math.ceil(message.text.length / 4)); // ~4 chars per token
                                estimated = true;
                            }

                            if (totalTokens === 0) return null;

                            const cost = calculateCost(
                                message.stats.model,
                                inputTokens,
                                outputTokens || (estimated ? totalTokens : 0),
                                userCurrency
                            );

                            return (
                              <>
                                <span>|</span>
                                <span>{estimated ? `~${totalTokens}` : totalTokens} tokens</span>
                                {cost && (
                                  <span className="text-green-400 ml-1 border-l border-white/20 pl-2">
                                    {cost}
                                  </span>
                                )}
                              </>
                            );
                        })()}
                    </div>
                )}
              </>
           )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
