import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { Send } from 'lucide-react';

interface SavingsGoalCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

export const SavingsGoalCalculator: React.FC<SavingsGoalCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol } = useProfile();
  const [target, setTarget] = useState<number>(30000);
  const [months, setMonths] = useState<number>(24);
  const [current, setCurrent] = useState<number>(5000);
  const [rate, setRate] = useState<number>(4.5);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    try {
      const data = await api.calculateSavingsGoal({
        target_amount: target,
        timeline_months: months,
        current_savings: current,
        annual_interest_rate: rate,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculate();
  }, [target, months, current, rate]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Target Goal ({currencySymbol})
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Timeline (Months)
          </label>
          <input
            type="number"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Current Savings ({currencySymbol})
          </label>
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            HYSA Interest (% p.a.)
          </label>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-3 gap-2 bg-surface p-3.5 rounded-xl border border-border shadow-warm text-center">
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Required Monthly</span>
              <p className="text-base font-semibold text-primary tabular-nums">
                {currencySymbol}{result.required_monthly_saving?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Total Contributions</span>
              <p className="text-base font-semibold text-text tabular-nums">
                {currencySymbol}{result.total_contributions?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Interest Earned</span>
              <p className="text-base font-semibold text-accent tabular-nums">
                {currencySymbol}{result.total_interest_earned?.toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={() => onInsertToChat(`I am saving for a ${currencySymbol}${target.toLocaleString()} goal over ${months} months. I need to save ${currencySymbol}${result.required_monthly_saving}/month. What are the best high-yield savings accounts or short-term liquid funds to keep this money safe?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Discuss this Savings Goal with FinSta
          </button>
        </>
      )}
    </div>
  );
};
