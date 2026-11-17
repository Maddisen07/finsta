import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { EmergencyFundChart } from '../Charts/EmergencyFundChart';
import { Send } from 'lucide-react';

interface EmergencyFundCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

export const EmergencyFundCalculator: React.FC<EmergencyFundCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol, profile } = useProfile();
  const [expenses, setExpenses] = useState<number>(profile.monthly_expenses || 2500);
  const [months, setMonths] = useState<number>(6);
  const [savings, setSavings] = useState<number>(3000);
  const [capacity, setCapacity] = useState<number>(400);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    try {
      const data = await api.calculateEmergencyFund({
        monthly_essential_expenses: expenses,
        months_target: months,
        current_savings: savings,
        monthly_savings_capacity: capacity,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculate();
  }, [expenses, months, savings, capacity]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Essential Expenses ({currencySymbol}/mo)
          </label>
          <input
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Safety Target (Months)
          </label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent"
          >
            <option value={3}>3 Months (Lean)</option>
            <option value={6}>6 Months (Standard)</option>
            <option value={9}>9 Months (Freelancers/Single Income)</option>
            <option value={12}>12 Months (High Security)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Current Savings ({currencySymbol})
          </label>
          <input
            type="number"
            value={savings}
            onChange={(e) => setSavings(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Monthly Saving ({currencySymbol}/mo)
          </label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>
      </div>

      {result && (
        <>
          <EmergencyFundChart data={result} />

          <button
            onClick={() => onInsertToChat(`My essential monthly expenses are ${currencySymbol}${expenses}. For a ${months}-month emergency buffer, I need ${currencySymbol}${result.target_fund}. I currently have ${currencySymbol}${savings} saved and can save ${currencySymbol}${capacity}/month. What are the best strategies to reach my emergency goal faster without burning out?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Discuss My Safety Net with FinSta
          </button>
        </>
      )}
    </div>
  );
};
