import React, { useState } from 'react';
import { X, Calculator, PieChart, TrendingUp, Target, Landmark, ShieldCheck } from 'lucide-react';
import { EmiCalculator } from './EmiCalculator';
import { SipCalculator } from './SipCalculator';
import { SavingsGoalCalculator } from './SavingsGoalCalculator';
import { BudgetSplitterCalculator } from './BudgetSplitterCalculator';
import { DebtPayoffCalculator } from './DebtPayoffCalculator';
import { EmergencyFundCalculator } from './EmergencyFundCalculator';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (prompt: string) => void;
}

type TabType = 'emi' | 'sip' | 'budget' | 'savings' | 'debt' | 'emergency';

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('emi');

  if (!isOpen) return null;

  const handleInsert = (prompt: string) => {
    onInsertToChat(prompt);
    onClose();
  };

  const tabs: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'emi', label: 'Loan / EMI', icon: Landmark },
    { id: 'sip', label: 'SIP / Compounding', icon: TrendingUp },
    { id: 'budget', label: '50/30/20 Budget', icon: PieChart },
    { id: 'savings', label: 'Savings Goal', icon: Target },
    { id: 'debt', label: 'Debt Payoff', icon: Calculator },
    { id: 'emergency', label: 'Emergency Fund', icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24221F]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background rounded-2xl shadow-warm border border-border w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary text-cream flex items-center justify-center font-bold text-xs">
              <Calculator className="w-4 h-4 text-cream" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-primary">
                FinSta Financial Calculators
              </h3>
              <p className="text-xs text-text-muted">
                Exact mathematical simulations grounded in proven financial formulas
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

        {/* Tab switcher */}
        <div className="flex overflow-x-auto border-b border-border bg-background px-6 py-2.5 gap-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-surface text-primary border border-border shadow-warm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-background">
          {activeTab === 'emi' && <EmiCalculator onInsertToChat={handleInsert} />}
          {activeTab === 'sip' && <SipCalculator onInsertToChat={handleInsert} />}
          {activeTab === 'budget' && <BudgetSplitterCalculator onInsertToChat={handleInsert} />}
          {activeTab === 'savings' && <SavingsGoalCalculator onInsertToChat={handleInsert} />}
          {activeTab === 'debt' && <DebtPayoffCalculator onInsertToChat={handleInsert} />}
          {activeTab === 'emergency' && <EmergencyFundCalculator onInsertToChat={handleInsert} />}
        </div>

      </div>
    </div>
  );
};
