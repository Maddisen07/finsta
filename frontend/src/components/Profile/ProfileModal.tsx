import React, { useState } from 'react';
import { X, User, Check, Trash2 } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { CURRENCIES, CurrencyCode, UserProfile } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, clearAllData, currencySymbol } = useProfile();

  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handleClear = async () => {
    await clearAllData();
    setShowClearConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24221F]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background rounded-2xl shadow-warm border border-border w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary text-cream flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4 text-cream" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-primary">
                FinSta Profile Memory
              </h3>
              <p className="text-xs text-text-muted">
                Personalizes financial calculations & coaching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-background transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 bg-background">
          
          {/* Currency */}
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Preferred Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code} className="bg-surface text-text">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Income & Expenses */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Monthly Income ({currencySymbol})
              </label>
              <input
                type="number"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: Number(e.target.value) })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Essential Living ({currencySymbol})
              </label>
              <input
                type="number"
                value={formData.monthly_expenses}
                onChange={(e) => setFormData({ ...formData, monthly_expenses: Number(e.target.value) })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              />
            </div>
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Investment Risk Tolerance
            </label>
            <select
              value={formData.risk_tolerance}
              onChange={(e) => setFormData({ ...formData, risk_tolerance: e.target.value as any })}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="conservative" className="bg-surface text-text">Conservative (Preserve capital, safe debt/bonds)</option>
              <option value="moderate" className="bg-surface text-text">Moderate (Balanced index funds, equities & bonds)</option>
              <option value="aggressive" className="bg-surface text-text">Aggressive (High-growth equities, maximum compounding)</option>
            </select>
          </div>

          {/* Primary Goal */}
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Primary Financial Goal
            </label>
            <input
              type="text"
              value={formData.primary_goal}
              onChange={(e) => setFormData({ ...formData, primary_goal: e.target.value })}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. Save $30,000 for house down payment"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs shadow-warm transition flex items-center justify-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" /> Profile Saved!
                </>
              ) : (
                'Save Profile Preferences'
              )}
            </button>
          </div>

          {/* Clear My Data Section */}
          <div className="pt-4 border-t border-border">
            {showClearConfirm ? (
              <div className="p-3 bg-surface border border-accent/40 rounded-xl space-y-2">
                <p className="text-xs text-text font-semibold">
                  Are you sure? This permanently deletes all your chat sessions and profile data from local storage & database.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 py-1.5 px-2 bg-accent hover:bg-[#C26325] text-[#24221F] text-xs font-bold rounded-lg transition"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="py-1.5 px-3 bg-background border border-border text-text text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-accent hover:underline rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear My Data
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
