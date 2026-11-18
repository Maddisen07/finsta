import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { InvestmentGrowthChart } from '../Charts/InvestmentGrowthChart';
import { Send, Calculator, RotateCcw } from 'lucide-react';

interface SipCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

const DEFAULT_MONTHLY = 500;
const DEFAULT_RATE = 10.0;
const DEFAULT_YEARS = 15;
const DEFAULT_LUMP_SUM = 0;

export const SipCalculator: React.FC<SipCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol } = useProfile();
  const [monthly, setMonthly] = useState<string>(String(DEFAULT_MONTHLY));
  const [rate, setRate] = useState<string>(String(DEFAULT_RATE));
  const [years, setYears] = useState<string>(String(DEFAULT_YEARS));
  const [lumpSum, setLumpSum] = useState<string>(String(DEFAULT_LUMP_SUM));
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeCalculation = async (mVal: number, rVal: number, yVal: number, lVal: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.calculateSip({
        monthly_investment: mVal,
        annual_return_rate: rVal,
        tenure_years: Math.round(yVal),
        initial_lump_sum: lVal,
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to calculate SIP. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeCalculation(DEFAULT_MONTHLY, DEFAULT_RATE, DEFAULT_YEARS, DEFAULT_LUMP_SUM);
  }, []);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const m = parseFloat(monthly);
    const r = parseFloat(rate);
    const y = parseFloat(years);
    const l = lumpSum.trim() === '' ? 0 : parseFloat(lumpSum);

    if (isNaN(m) || monthly.trim() === '') {
      setErrorMsg('Please enter a valid monthly investment amount.');
      return;
    }
    if (m <= 0) {
      setErrorMsg('Monthly investment must be greater than 0.');
      return;
    }
    if (isNaN(r) || rate.trim() === '') {
      setErrorMsg('Please enter expected annual return rate.');
      return;
    }
    if (r < 0) {
      setErrorMsg('Return rate cannot be negative.');
      return;
    }
    if (isNaN(y) || years.trim() === '') {
      setErrorMsg('Please enter investment duration in years.');
      return;
    }
    if (y <= 0 || y > 50) {
      setErrorMsg('Duration must be between 1 and 50 years.');
      return;
    }
    if (isNaN(l) || l < 0) {
      setErrorMsg('Initial lump sum cannot be negative.');
      return;
    }

    executeCalculation(m, r, y, l);
  };

  const handleReset = () => {
    setMonthly(String(DEFAULT_MONTHLY));
    setRate(String(DEFAULT_RATE));
    setYears(String(DEFAULT_YEARS));
    setLumpSum(String(DEFAULT_LUMP_SUM));
    setErrorMsg(null);
    executeCalculation(DEFAULT_MONTHLY, DEFAULT_RATE, DEFAULT_YEARS, DEFAULT_LUMP_SUM);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalculate} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Monthly Investment ({currencySymbol})
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Expected Return (% p.a.)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 10.0"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Duration (Years)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              step="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 15"
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
            {isLoading ? 'Calculating...' : 'Calculate Growth'}
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
              <span className="text-[10px] uppercase font-semibold text-text-muted">Total Invested</span>
              <p className="text-base font-semibold text-text-muted tabular-nums">
                {currencySymbol}{result.invested_amount?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Compound Returns</span>
              <p className="text-base font-semibold text-accent tabular-nums">
                {currencySymbol}{result.estimated_returns?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Estimated Total</span>
              <p className="text-base font-semibold text-primary tabular-nums">
                {currencySymbol}{result.total_value?.toLocaleString()}
              </p>
            </div>
          </div>

          <InvestmentGrowthChart data={result.chart_data} />

          <button
            onClick={() => onInsertToChat(`What happens if I invest ${currencySymbol}${Number(monthly).toLocaleString()}/month for ${years} years at ${rate}% return? Can you break down the compounding effect?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Discuss this Investment Plan with FinSta
          </button>
        </>
      )}
    </div>
  );
};
