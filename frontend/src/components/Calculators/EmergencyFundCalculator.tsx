import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { EmergencyFundChart } from '../Charts/EmergencyFundChart';
import { Send, Calculator, RotateCcw } from 'lucide-react';

interface EmergencyFundCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

const DEFAULT_EXPENSES = 2500;
const DEFAULT_MONTHS = 6;
const DEFAULT_SAVINGS = 3000;
const DEFAULT_CAPACITY = 400;

export const EmergencyFundCalculator: React.FC<EmergencyFundCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol, profile } = useProfile();
  const [expenses, setExpenses] = useState<string>(String(profile.monthly_expenses || DEFAULT_EXPENSES));
  const [months, setMonths] = useState<number>(DEFAULT_MONTHS);
  const [savings, setSavings] = useState<string>(String(DEFAULT_SAVINGS));
  const [capacity, setCapacity] = useState<string>(String(DEFAULT_CAPACITY));
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeCalculation = async (expVal: number, mVal: number, sVal: number, cVal: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.calculateEmergencyFund({
        monthly_essential_expenses: expVal,
        months_target: mVal,
        current_savings: sVal,
        monthly_savings_capacity: cVal,
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to calculate emergency fund. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeCalculation(
      profile.monthly_expenses || DEFAULT_EXPENSES,
      DEFAULT_MONTHS,
      DEFAULT_SAVINGS,
      DEFAULT_CAPACITY
    );
  }, []);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const exp = parseFloat(expenses);
    const sav = savings.trim() === '' ? 0 : parseFloat(savings);
    const cap = capacity.trim() === '' ? 0 : parseFloat(capacity);

    if (isNaN(exp) || expenses.trim() === '') {
      setErrorMsg('Please enter essential monthly living expenses.');
      return;
    }
    if (exp <= 0) {
      setErrorMsg('Essential living expenses must be greater than 0.');
      return;
    }
    if (isNaN(sav) || sav < 0) {
      setErrorMsg('Current savings cannot be negative.');
      return;
    }
    if (isNaN(cap) || cap < 0) {
      setErrorMsg('Monthly savings capacity cannot be negative.');
      return;
    }

    executeCalculation(exp, months, sav, cap);
  };

  const handleReset = () => {
    const baseExp = profile.monthly_expenses || DEFAULT_EXPENSES;
    setExpenses(String(baseExp));
    setMonths(DEFAULT_MONTHS);
    setSavings(String(DEFAULT_SAVINGS));
    setCapacity(String(DEFAULT_CAPACITY));
    setErrorMsg(null);
    executeCalculation(baseExp, DEFAULT_MONTHS, DEFAULT_SAVINGS, DEFAULT_CAPACITY);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalculate} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Essential Expenses ({currencySymbol}/mo)
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 2500"
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
              <option value={3}>3 Months (Baseline Dual-Income)</option>
              <option value={6}>6 Months (Standard Recommended)</option>
              <option value={9}>9 Months (Single Income / Family)</option>
              <option value={12}>12 Months (Freelancer / Variable)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Current Liquid Cash ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 3000"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Monthly Savings Speed ({currencySymbol}/mo)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 400"
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
            {isLoading ? 'Calculating...' : 'Calculate Fund Buffer'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-surface text-text hover:bg-background text-xs font-semibold transition"
            title="Reset to default values"
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
          <EmergencyFundChart data={result} />

          <button
            onClick={() => onInsertToChat(`I am planning a ${months}-month emergency fund for essential expenses of ${currencySymbol}${Number(expenses).toLocaleString()}/month. My target is ${currencySymbol}${result.target_fund}. What are the safest liquid accounts to store this buffer?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Discuss Emergency Planning with FinSta
          </button>
        </>
      )}
    </div>
  );
};
