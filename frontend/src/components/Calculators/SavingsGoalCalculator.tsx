import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { Send, Calculator, RotateCcw } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface SavingsGoalCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

const DEFAULT_TARGET = 30000;
const DEFAULT_MONTHS = 24;
const DEFAULT_CURRENT = 5000;
const DEFAULT_RATE = 4.5;

export const SavingsGoalCalculator: React.FC<SavingsGoalCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol } = useProfile();
  const [target, setTarget] = useState<string>(String(DEFAULT_TARGET));
  const [months, setMonths] = useState<string>(String(DEFAULT_MONTHS));
  const [current, setCurrent] = useState<string>(String(DEFAULT_CURRENT));
  const [rate, setRate] = useState<string>(String(DEFAULT_RATE));
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeCalculation = async (tVal: number, mVal: number, cVal: number, rVal: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.calculateSavingsGoal({
        target_amount: tVal,
        timeline_months: Math.round(mVal),
        current_savings: cVal,
        annual_interest_rate: rVal,
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to calculate savings goal. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeCalculation(DEFAULT_TARGET, DEFAULT_MONTHS, DEFAULT_CURRENT, DEFAULT_RATE);
  }, []);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const t = parseFloat(target);
    const m = parseFloat(months);
    const c = current.trim() === '' ? 0 : parseFloat(current);
    const r = rate.trim() === '' ? 0 : parseFloat(rate);

    if (isNaN(t) || target.trim() === '') {
      setErrorMsg('Please enter a target goal amount.');
      return;
    }
    if (t <= 0) {
      setErrorMsg('Target goal must be greater than 0.');
      return;
    }
    if (isNaN(m) || months.trim() === '') {
      setErrorMsg('Please enter a timeline in months.');
      return;
    }
    if (m <= 0 || m > 600) {
      setErrorMsg('Timeline must be between 1 and 600 months.');
      return;
    }
    if (isNaN(c) || c < 0) {
      setErrorMsg('Current savings cannot be negative.');
      return;
    }
    if (isNaN(r) || r < 0) {
      setErrorMsg('Interest rate cannot be negative.');
      return;
    }

    executeCalculation(t, m, c, r);
  };

  const handleReset = () => {
    setTarget(String(DEFAULT_TARGET));
    setMonths(String(DEFAULT_MONTHS));
    setCurrent(String(DEFAULT_CURRENT));
    setRate(String(DEFAULT_RATE));
    setErrorMsg(null);
    executeCalculation(DEFAULT_TARGET, DEFAULT_MONTHS, DEFAULT_CURRENT, DEFAULT_RATE);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalculate} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Target Goal ({currencySymbol})
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 30000"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Timeline (Months)
            </label>
            <input
              type="number"
              min="1"
              max="600"
              step="1"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 24"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Current Savings ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 5000"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              HYSA Interest (% p.a.)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 4.5"
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
            {isLoading ? 'Calculating...' : 'Calculate Savings Plan'}
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

          {result.chart_data && result.chart_data.length > 0 && (
            <div className="w-full bg-surface rounded-xl p-4 border border-border shadow-warm mt-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Goal Growth Projection
                </h4>
                <span className="text-[11px] text-text-muted font-medium">
                  Target: {currencySymbol}{Number(target).toLocaleString()} in {months} mos
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.chart_data}>
                    <defs>
                      <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E4D3B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1E4D3B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD3" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#716A5F" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#716A5F"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString()}`, 'Balance']}
                      contentStyle={{
                        backgroundColor: '#FAF8F5',
                        borderColor: '#E2DCD3',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#24221F',
                      }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#1E4D3B" strokeWidth={2} fill="url(#goalGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <button
            onClick={() => onInsertToChat(`I am saving for a ${currencySymbol}${Number(target).toLocaleString()} goal over ${months} months. I need to save ${currencySymbol}${result.required_monthly_saving}/month. What are the best high-yield savings accounts or short-term liquid funds to keep this money safe?`)}
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
