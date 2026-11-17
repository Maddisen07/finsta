import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 max-w-2xl animate-in fade-in duration-200">
      <div className="w-9 h-9 rounded-full bg-primary text-cream border border-primary/20 flex items-center justify-center shrink-0 shadow-warm font-bold text-sm mt-0.5">
        F
      </div>

      <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-warm flex items-center gap-2">
        <span className="text-xs text-text-muted font-medium mr-1">
          FinSta is computing...
        </span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" />
        </div>
      </div>
    </div>
  );
};
