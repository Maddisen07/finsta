import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { BudgetPieChart } from '../Charts/BudgetPieChart';
import { Send } from 'lucide-react';

interface BudgetSplitterCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

export const BudgetSplitterCalculator: React.FC<BudgetSplitterCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol, profile } = useProfile();
  const [income, setIncome] = useState<number>(profile.monthly_income || 5000);
  const [needsPct, setNeedsPct] = useState<number>(50);
  const [wantsPct, setWantsPct] = useState<number>(30);
  const [savingsPct, setSavingsPct] = useState<number>(20);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    try {
      const data = await api.calculateBudget({
        monthly_income: income,
        needs_pct: needsPct,
        wants_pct: wantsPct,
        savings_pct: savingsPct,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculate();
  }, [income, needsPct, wantsPct, savingsPct]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-text-muted block mb-1">
          Monthly Take-Home Income ({currencySymbol})
        </label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
          className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">Needs ({needsPct}%)</label>
          <input
            type="range"
            min="30"
            max="70"
            value={needsPct}
            onChange={(e) => setNeedsPct(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">Wants ({wantsPct}%)</label>
          <input
            type="range"
            min="10"
            max="50"
            value={wantsPct}
            onChange={(e) => setWantsPct(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">Savings ({savingsPct}%)</label>
          <input
            type="range"
            min="10"
            max="50"
            value={savingsPct}
            onChange={(e) => setSavingsPct(Number(e.target.value))}
            className="w-full accent-primary-light"
          />
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-3 gap-2 bg-surface p-3.5 rounded-xl border border-border shadow-warm text-center">
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Needs ({result.needs.percentage}%)</span>
              <p className="text-sm font-semibold text-primary tabular-nums">
                {currencySymbol}{result.needs.amount?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Wants ({result.wants.percentage}%)</span>
              <p className="text-sm font-semibold text-accent tabular-nums">
                {currencySymbol}{result.wants.amount?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Savings ({result.savings.percentage}%)</span>
              <p className="text-sm font-semibold text-text tabular-nums">
                {currencySymbol}{result.savings.amount?.toLocaleString()}
              </p>
            </div>
          </div>

          <BudgetPieChart data={result.chart_data} />

          <button
            onClick={() => onInsertToChat(`My monthly income is ${currencySymbol}${income.toLocaleString()}. With a ${needsPct}/${wantsPct}/${savingsPct} split, I have ${currencySymbol}${result.needs.amount} for needs, ${currencySymbol}${result.wants.amount} for wants, and ${currencySymbol}${result.savings.amount} for savings. How can I optimize this based on current high living costs?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Get Personalized Budgeting Tips from FinSta
          </button>
        </>
      )}
    </div>
  );
};
