import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { DebtComparisonChart } from '../Charts/DebtComparisonChart';
import { Send, Plus, Trash2, Calculator, RotateCcw } from 'lucide-react';

interface DebtPayoffCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

interface DebtRow {
  name: string;
  balance: number;
  interest_rate: number;
  min_payment: number;
}

const DEFAULT_DEBTS: DebtRow[] = [
  { name: 'Credit Card A', balance: 4000, interest_rate: 22.5, min_payment: 110 },
  { name: 'Store Card', balance: 1500, interest_rate: 27.9, min_payment: 50 },
  { name: 'Car Loan', balance: 9000, interest_rate: 6.5, min_payment: 200 },
];
const DEFAULT_EXTRA = 150;

export const DebtPayoffCalculator: React.FC<DebtPayoffCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol } = useProfile();
  const [debts, setDebts] = useState<DebtRow[]>(DEFAULT_DEBTS);
  const [extraPayment, setExtraPayment] = useState<string>(String(DEFAULT_EXTRA));
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeCalculation = async (debtsList: DebtRow[], extraVal: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.calculateDebtPayoff({
        debts: debtsList,
        extra_monthly_payment: extraVal,
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to calculate debt payoff. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeCalculation(DEFAULT_DEBTS, DEFAULT_EXTRA);
  }, []);

  const addDebt = () => {
    setDebts([
      ...debts,
      { name: `Debt ${debts.length + 1}`, balance: 2500, interest_rate: 18.0, min_payment: 75 }
    ]);
  };

  const removeDebt = (index: number) => {
    if (debts.length <= 1) return;
    setDebts(debts.filter((_, i) => i !== index));
  };

  const updateDebt = (index: number, field: keyof DebtRow, val: any) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: val };
    setDebts(updated);
  };

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const extra = extraPayment.trim() === '' ? 0 : parseFloat(extraPayment);
    if (isNaN(extra) || extra < 0) {
      setErrorMsg('Extra monthly payment cannot be negative.');
      return;
    }

    if (debts.length === 0) {
      setErrorMsg('Please add at least one debt.');
      return;
    }

    for (let i = 0; i < debts.length; i++) {
      const d = debts[i];
      if (!d.name || d.name.trim() === '') {
        setErrorMsg(`Please enter a name for Debt #${i + 1}.`);
        return;
      }
      if (isNaN(d.balance) || d.balance <= 0) {
        setErrorMsg(`Balance for "${d.name}" must be greater than 0.`);
        return;
      }
      if (isNaN(d.interest_rate) || d.interest_rate < 0) {
        setErrorMsg(`Interest rate for "${d.name}" cannot be negative.`);
        return;
      }
      if (isNaN(d.min_payment) || d.min_payment <= 0) {
        setErrorMsg(`Minimum payment for "${d.name}" must be greater than 0.`);
        return;
      }
    }

    executeCalculation(debts, extra);
  };

  const handleReset = () => {
    setDebts(DEFAULT_DEBTS);
    setExtraPayment(String(DEFAULT_EXTRA));
    setErrorMsg(null);
    executeCalculation(DEFAULT_DEBTS, DEFAULT_EXTRA);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalculate} className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text uppercase tracking-wider">
            Your Current Debts & Loans
          </span>
          <button
            type="button"
            onClick={addDebt}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface hover:bg-background border border-border text-primary transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Another Debt
          </button>
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {debts.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-surface p-2.5 rounded-xl border border-border">
              <input
                type="text"
                value={d.name}
                onChange={(e) => updateDebt(idx, 'name', e.target.value)}
                placeholder="Debt name"
                className="w-1/3 text-xs font-semibold p-1.5 rounded-lg border border-border bg-background text-text outline-none focus:ring-1 focus:ring-accent"
              />
              <div className="flex-1 flex items-center gap-1">
                <span className="text-xs text-text-muted">{currencySymbol}</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={d.balance}
                  onChange={(e) => updateDebt(idx, 'balance', Number(e.target.value))}
                  placeholder="Balance"
                  className="w-full text-xs font-semibold p-1.5 rounded-lg border border-border bg-background text-text outline-none focus:ring-1 focus:ring-accent tabular-nums"
                />
              </div>
              <div className="w-20 flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={d.interest_rate}
                  onChange={(e) => updateDebt(idx, 'interest_rate', Number(e.target.value))}
                  placeholder="APR %"
                  className="w-full text-xs font-semibold p-1.5 rounded-lg border border-border bg-background text-text outline-none focus:ring-1 focus:ring-accent tabular-nums"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
              <div className="w-24 flex items-center gap-1">
                <span className="text-xs text-text-muted">Min</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={d.min_payment}
                  onChange={(e) => updateDebt(idx, 'min_payment', Number(e.target.value))}
                  placeholder="Min"
                  className="w-full text-xs font-semibold p-1.5 rounded-lg border border-border bg-background text-text outline-none focus:ring-1 focus:ring-accent tabular-nums"
                />
              </div>
              <button
                type="button"
                onClick={() => removeDebt(idx)}
                disabled={debts.length <= 1}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent disabled:opacity-30 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Extra Monthly Budget for Debt Payoff ({currencySymbol})
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={extraPayment}
            onChange={(e) => setExtraPayment(e.target.value)}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
            placeholder="e.g. 150"
          />
        </div>

        {/* Action Buttons: Calculate + Reset */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs shadow-warm transition disabled:opacity-50"
          >
            <Calculator className="w-4 h-4" />
            {isLoading ? 'Calculating...' : 'Compare Payoff Methods'}
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
          <div className="grid grid-cols-2 gap-3">
            {/* Avalanche Summary */}
            <div className="p-3.5 rounded-xl bg-surface border border-primary/30 shadow-warm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-primary">Avalanche (Optimal)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Saves {currencySymbol}{result.interest_difference?.toLocaleString()}
                </span>
              </div>
              <p className="text-sm font-semibold text-text tabular-nums">
                Interest: {currencySymbol}{result.avalanche?.total_interest_paid?.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-0.5 tabular-nums">
                Debt free in {result.avalanche?.total_months} months
              </p>
            </div>

            {/* Snowball Summary */}
            <div className="p-3.5 rounded-xl bg-surface border border-accent/30 shadow-warm">
              <span className="text-xs font-bold text-accent block mb-1">Snowball (Momentum)</span>
              <p className="text-sm font-semibold text-text tabular-nums">
                Interest: {currencySymbol}{result.snowball?.total_interest_paid?.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-0.5 tabular-nums">
                Debt free in {result.snowball?.total_months} months
              </p>
            </div>
          </div>

          <DebtComparisonChart data={result.comparison_chart} />

          <button
            onClick={() => onInsertToChat(`I compared the Debt Avalanche vs Snowball method for my ${debts.length} debts with ${currencySymbol}${extraPayment}/mo extra payment. Avalanche saves ${currencySymbol}${result.interest_difference}. Which strategy fits my profile better?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Discuss this Debt Strategy with FinSta
          </button>
        </>
      )}
    </div>
  );
};
