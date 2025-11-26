import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, GripVertical } from 'lucide-react';
import styles from './AIHelper.module.css';

interface AIHelperProps {
  selectedCode: string;
  onSendToChat: (message: string, createNewSession?: boolean) => void;
}

export default function AIHelper({ selectedCode, onSendToChat }: AIHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [buttonY, setButtonY] = useState(() => {
    // Load saved position from localStorage
    const saved = localStorage.getItem('aiHelperButtonY');
    return saved ? parseInt(saved, 10) : 20; // Default 20px from bottom
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartButtonY = useRef(0);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('aiHelperButtonY', buttonY.toString());
  }, [buttonY]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartButtonY.current = buttonY;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current;
      const windowHeight = window.innerHeight;
      const newY = Math.max(20, Math.min(windowHeight - 100, dragStartButtonY.current - deltaY));
      setButtonY(newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleQuickAction = (action: 'explain' | 'improve' | 'fix' | 'document') => {
    let message = '';

    if (selectedCode) {
      switch (action) {
        case 'explain':
          message = `Can you explain this code?\n\n\`\`\`\n${selectedCode}\n\`\`\``;
          break;
        case 'improve':
          message = `How can I improve this code?\n\n\`\`\`\n${selectedCode}\n\`\`\``;
          break;
        case 'fix':
          message = `This code has an error. Can you help fix it?\n\n\`\`\`\n${selectedCode}\n\`\`\``;
          break;
        case 'document':
          message = `Add documentation/comments to this code:\n\n\`\`\`\n${selectedCode}\n\`\`\``;
          break;
      }
    } else {
      message = `I need help with ${action}`;
    }

    // Create new chat session for editor assistance
    onSendToChat(message, true);
    setIsOpen(false);
  };

  const handleCustomPrompt = () => {
    if (!prompt.trim()) return;

    let message = prompt;
    if (selectedCode) {
      message += `\n\n\`\`\`\n${selectedCode}\n\`\`\``;
    }

    // Create new chat session for custom question
    onSendToChat(message, true);
    setPrompt('');
    setIsOpen(false);
  };

  return (
    <div className={styles.aiHelper} style={{ bottom: `${buttonY}px` }}>
      <div
        className={`${styles.dragHandle} ${isDragging ? styles.dragging : ''}`}
        onMouseDown={handleMouseDown}
        title="Drag to move"
      >
        <GripVertical size={16} />
      </div>
      <button
        className={styles.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        <MessageSquare size={20} />
        {selectedCode && <span className={styles.badge}>!</span>}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>AI Assistant</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {selectedCode && (
            <div className={styles.selectedCode}>
              <small>Selected code:</small>
              <code>{selectedCode.substring(0, 100)}...</code>
            </div>
          )}

          <div className={styles.quickActions}>
            <h4>Quick Actions:</h4>
            <button onClick={() => handleQuickAction('explain')}>
              Explain Code
            </button>
            <button onClick={() => handleQuickAction('improve')}>
              Improve Code
            </button>
            <button onClick={() => handleQuickAction('fix')}>
              Fix Errors
            </button>
            <button onClick={() => handleQuickAction('document')}>
              Add Documentation
            </button>
          </div>

          <div className={styles.customPrompt}>
            <h4>Custom Question:</h4>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything about your code..."
              rows={3}
            />
            <button onClick={handleCustomPrompt} disabled={!prompt.trim()}>
              <Send size={16} />
              Send to Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
