import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { DebtComparisonChart } from '../Charts/DebtComparisonChart';
import { Send, Plus, Trash2 } from 'lucide-react';

interface DebtPayoffCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

interface DebtRow {
  name: string;
  balance: number;
  interest_rate: number;
  min_payment: number;
}

export const DebtPayoffCalculator: React.FC<DebtPayoffCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol } = useProfile();
  const [debts, setDebts] = useState<DebtRow[]>([
    { name: 'Credit Card A', balance: 4000, interest_rate: 22.5, min_payment: 110 },
    { name: 'Store Card', balance: 1500, interest_rate: 27.9, min_payment: 50 },
    { name: 'Car Loan', balance: 9000, interest_rate: 6.5, min_payment: 200 },
  ]);
  const [extraPayment, setExtraPayment] = useState<number>(150);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    try {
      const data = await api.calculateDebtPayoff({
        debts,
        extra_monthly_payment: extraPayment,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculate();
  }, [debts, extraPayment]);

  const addDebt = () => {
    setDebts([
      ...debts,
      { name: `Loan ${debts.length + 1}`, balance: 2000, interest_rate: 15.0, min_payment: 60 }
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Your Current Debts</span>
          <button
            onClick={addDebt}
            className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add Debt
          </button>
        </div>

        {debts.map((d, i) => (
          <div key={i} className="grid grid-cols-4 sm:grid-cols-5 gap-2 items-center bg-surface p-2.5 rounded-xl border border-border text-xs">
            <input
              type="text"
              value={d.name}
              onChange={(e) => updateDebt(i, 'name', e.target.value)}
              className="col-span-1 sm:col-span-2 p-1.5 rounded-lg bg-background border border-border text-text font-medium"
              placeholder="Debt Name"
            />
            <div>
              <span className="text-[9px] text-text-muted block">Bal ({currencySymbol})</span>
              <input
                type="number"
                value={d.balance}
                onChange={(e) => updateDebt(i, 'balance', Number(e.target.value))}
                className="w-full p-1.5 rounded-lg bg-background border border-border font-semibold text-text tabular-nums"
              />
            </div>
            <div>
              <span className="text-[9px] text-text-muted block">APR %</span>
              <input
                type="number"
                step="0.1"
                value={d.interest_rate}
                onChange={(e) => updateDebt(i, 'interest_rate', Number(e.target.value))}
                className="w-full p-1.5 rounded-lg bg-background border border-border font-semibold text-text tabular-nums"
              />
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1">
                <span className="text-[9px] text-text-muted block">Min ({currencySymbol})</span>
                <input
                  type="number"
                  value={d.min_payment}
                  onChange={(e) => updateDebt(i, 'min_payment', Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg bg-background border border-border font-semibold text-text tabular-nums"
                />
              </div>
              {debts.length > 1 && (
                <button onClick={() => removeDebt(i)} className="text-accent hover:text-accent-dark p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-semibold text-text-muted block mb-1">
          Extra Monthly Payment Budget ({currencySymbol})
        </label>
        <input
          type="number"
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
        />
      </div>

      {result && (
        <>
          <div className="p-3.5 rounded-xl bg-surface border border-border shadow-warm text-xs text-text">
            <span className="font-semibold text-primary block mb-1">
              Strategy Recommendation:
            </span>
            {result.recommendation}
          </div>

          <DebtComparisonChart data={result.comparison_chart} />

          <button
            onClick={() => onInsertToChat(`I compared Avalanche vs Snowball for my debts with ${currencySymbol}${extraPayment} extra monthly budget. Avalanche saves me ${currencySymbol}${result.interest_difference} in interest. Which strategy fits someone who needs psychological momentum vs pure mathematical savings?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Discuss My Debt Payoff Strategy with FinSta
          </button>
        </>
      )}
    </div>
  );
};
