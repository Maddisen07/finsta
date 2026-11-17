import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-background border-t border-border py-3 px-4 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        
        {/* Mandatory Footer Disclaimer */}
        <p className="text-xs text-text-muted font-normal tracking-wide">
          FinSta provides educational information, not professional financial advice.
        </p>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Client-side privacy • No bank credentials stored</span>
        </div>

      </div>
    </footer>
  );
};
