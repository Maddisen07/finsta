import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Shield } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      <div className="relative bg-surface border border-border rounded-2xl shadow-warm focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition">
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask FinSta anything about budgeting, loans, savings, SIP growth, or debt..."
          rows={1}
          maxLength={4000}
          className="w-full resize-none bg-transparent px-4 py-3.5 pr-24 text-base text-text placeholder:text-text-muted outline-none max-h-40 overflow-y-auto"
        />

        {/* Action Controls */}
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {input.length > 200 && (
            <span className="text-[11px] text-text-muted font-medium tabular-nums mr-1">
              {input.length}/4000
            </span>
          )}

          {isStreaming ? (
            <button
              onClick={onStopStreaming}
              className="p-2 rounded-xl bg-accent text-[#24221F] hover:bg-[#C26325] focus:outline-none focus:ring-2 focus:ring-accent transition shadow-warm"
              title="Stop response"
            >
              <Square className="w-4 h-4 fill-[#24221F]" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={`p-2.5 rounded-xl font-bold transition shadow-warm ${
                input.trim()
                  ? 'bg-accent text-[#24221F] hover:bg-[#C26325] active:ring-2 active:ring-accent focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer'
                  : 'bg-border/60 text-text-muted/60 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

      </div>

      <div className="flex items-center justify-center gap-2 mt-2 text-xs text-text-muted">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span>FinSta masks card numbers, SSN, and PAN before processing. Press Enter to send.</span>
      </div>
    </div>
  );
};
