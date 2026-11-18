import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { BudgetPieChart } from '../Charts/BudgetPieChart';
import { Send, Calculator, RotateCcw } from 'lucide-react';

interface BudgetSplitterCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

const DEFAULT_INCOME = 5000;
const DEFAULT_NEEDS = 50;
const DEFAULT_WANTS = 30;
const DEFAULT_SAVINGS = 20;

export const BudgetSplitterCalculator: React.FC<BudgetSplitterCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol, profile } = useProfile();
  const [income, setIncome] = useState<string>(String(profile.monthly_income || DEFAULT_INCOME));
  const [needsPct, setNeedsPct] = useState<number>(DEFAULT_NEEDS);
  const [wantsPct, setWantsPct] = useState<number>(DEFAULT_WANTS);
  const [savingsPct, setSavingsPct] = useState<number>(DEFAULT_SAVINGS);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeCalculation = async (incVal: number, nVal: number, wVal: number, sVal: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.calculateBudget({
        monthly_income: incVal,
        needs_pct: nVal,
        wants_pct: wVal,
        savings_pct: sVal,
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to calculate budget. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeCalculation(profile.monthly_income || DEFAULT_INCOME, DEFAULT_NEEDS, DEFAULT_WANTS, DEFAULT_SAVINGS);
  }, []);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const inc = parseFloat(income);

    if (isNaN(inc) || income.trim() === '') {
      setErrorMsg('Please enter a valid monthly income.');
      return;
    }
    if (inc <= 0) {
      setErrorMsg('Monthly income must be greater than 0.');
      return;
    }

    const totalPct = needsPct + wantsPct + savingsPct;
    if (totalPct !== 100) {
      setErrorMsg(`Percentages must add up to 100% (currently ${totalPct}%).`);
      return;
    }

    executeCalculation(inc, needsPct, wantsPct, savingsPct);
  };

  const handleReset = () => {
    const base = profile.monthly_income || DEFAULT_INCOME;
    setIncome(String(base));
    setNeedsPct(DEFAULT_NEEDS);
    setWantsPct(DEFAULT_WANTS);
    setSavingsPct(DEFAULT_SAVINGS);
    setErrorMsg(null);
    executeCalculation(base, DEFAULT_NEEDS, DEFAULT_WANTS, DEFAULT_SAVINGS);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalculate} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Monthly Take-Home Income ({currencySymbol})
          </label>
          <input
            type="number"
            min="1"
            step="any"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
            placeholder="e.g. 5000"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-primary">Needs</span>
              <span className="tabular-nums font-bold">{needsPct}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={needsPct}
              onChange={(e) => setNeedsPct(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-accent">Wants</span>
              <span className="tabular-nums font-bold">{wantsPct}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={wantsPct}
              onChange={(e) => setWantsPct(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-[#5B8A74]">Savings</span>
              <span className="tabular-nums font-bold">{savingsPct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={savingsPct}
              onChange={(e) => setSavingsPct(Number(e.target.value))}
              className="w-full accent-[#5B8A74] cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons: Calculate + Reset */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs shadow-warm transition disabled:opacity-50"
          >
            <Calculator className="w-4 h-4" />
            {isLoading ? 'Calculating...' : 'Calculate Budget Split'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-surface text-text hover:bg-background text-xs font-semibold transition"
            title="Reset to 50/30/20 default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-semibold text-accent">
          {errorMsg}
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-3 gap-2 bg-surface p-3.5 rounded-xl border border-border shadow-warm text-center">
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">
                Needs ({result.needs?.percentage}%)
              </span>
              <p className="text-sm font-semibold text-primary tabular-nums">
                {currencySymbol}{result.needs?.amount?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">
                Wants ({result.wants?.percentage}%)
              </span>
              <p className="text-sm font-semibold text-accent tabular-nums">
                {currencySymbol}{result.wants?.amount?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">
                Savings ({result.savings?.percentage}%)
              </span>
              <p className="text-sm font-semibold text-[#5B8A74] tabular-nums">
                {currencySymbol}{result.savings?.amount?.toLocaleString()}
              </p>
            </div>
          </div>

          <BudgetPieChart data={result.chart_data} />

          <button
            onClick={() => onInsertToChat(`I am planning my budget with a take-home pay of ${currencySymbol}${Number(income).toLocaleString()}. My target split is ${needsPct}% Needs (${currencySymbol}${result.needs?.amount}), ${wantsPct}% Wants (${currencySymbol}${result.wants?.amount}), and ${savingsPct}% Savings (${currencySymbol}${result.savings?.amount}). How can I optimize this?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Discuss this Budget with FinSta
          </button>
        </>
      )}
    </div>
  );
};
