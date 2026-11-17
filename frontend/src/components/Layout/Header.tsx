import React from 'react';
import { Sparkles, Moon, Sun, Calculator, User, Download, PlusCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useProfile } from '../../context/ProfileContext';
import { CURRENCIES, CurrencyCode } from '../../types';

interface HeaderProps {
  onOpenCalculators: () => void;
  onOpenProfile: () => void;
  onOpenExport: () => void;
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCalculators,
  onOpenProfile,
  onOpenExport,
  onNewChat,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, setCurrency } = useProfile();

  return (
    <header className="sticky top-0 z-30 bg-primary text-cream shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand identity: primary circle with a cream 'F' or coin icon */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cream/15 border border-cream/30 flex items-center justify-center font-bold text-lg text-cream tracking-tight">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-cream">
                FinSta
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-[#24221F]">
                Sidekick
              </span>
            </div>
            <p className="text-xs text-cream/80 font-normal hidden sm:block">
              Your smart money sidekick
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cream/15 text-cream hover:bg-cream/25 border border-cream/20 transition"
            title="Start a new chat session"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cream" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* Currency Switcher */}
          <select
            value={profile.currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="text-xs font-semibold bg-cream/15 text-cream border border-cream/25 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-accent transition cursor-pointer"
            title="Select currency"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code} className="bg-surface text-text">
                {c.symbol} {c.code}
              </option>
            ))}
          </select>

          {/* Calculators Trigger */}
          <button
            onClick={onOpenCalculators}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-cream/90 hover:bg-cream/15 transition"
            title="Financial Calculators"
          >
            <Calculator className="w-3.5 h-3.5 text-cream" />
            <span className="hidden md:inline">Calculators</span>
          </button>

          {/* Profile Trigger */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-cream/90 hover:bg-cream/15 transition"
            title="User Profile & Memory"
          >
            <User className="w-3.5 h-3.5 text-cream" />
            <span className="hidden md:inline">Profile</span>
          </button>

          {/* Export Trigger */}
          <button
            onClick={onOpenExport}
            className="p-2 text-cream/90 hover:bg-cream/15 rounded-lg transition"
            title="Export Conversation"
          >
            <Download className="w-4 h-4 text-cream" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-cream/90 hover:bg-cream/15 rounded-lg transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-accent-light" /> : <Moon className="w-4 h-4 text-cream" />}
          </button>
        </div>

      </div>
    </header>
  );
};
