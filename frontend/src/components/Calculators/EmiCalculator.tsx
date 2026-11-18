import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { AmortizationChart } from '../Charts/AmortizationChart';
import { Send, Calculator, RotateCcw } from 'lucide-react';

interface EmiCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

const DEFAULT_PRINCIPAL = 200000;
const DEFAULT_RATE = 7.0;
const DEFAULT_TENURE = 15;

export const EmiCalculator: React.FC<EmiCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol } = useProfile();
  const [principal, setPrincipal] = useState<string>(String(DEFAULT_PRINCIPAL));
  const [annualRate, setAnnualRate] = useState<string>(String(DEFAULT_RATE));
  const [tenureYears, setTenureYears] = useState<string>(String(DEFAULT_TENURE));
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeCalculation = async (pVal: number, rVal: number, tVal: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.calculateEmi({
        principal: pVal,
        annual_rate: rVal,
        tenure_months: Math.round(tVal * 12),
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to calculate EMI. Please check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial calculation on tab load
  useEffect(() => {
    executeCalculation(DEFAULT_PRINCIPAL, DEFAULT_RATE, DEFAULT_TENURE);
  }, []);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const p = parseFloat(principal);
    const r = parseFloat(annualRate);
    const t = parseFloat(tenureYears);

    if (isNaN(p) || principal.trim() === '') {
      setErrorMsg('Please enter a valid loan amount.');
      return;
    }
    if (p <= 0) {
      setErrorMsg('Loan amount must be greater than 0.');
      return;
    }
    if (isNaN(r) || annualRate.trim() === '') {
      setErrorMsg('Please enter a valid interest rate.');
      return;
    }
    if (r < 0) {
      setErrorMsg('Interest rate cannot be negative.');
      return;
    }
    if (isNaN(t) || tenureYears.trim() === '') {
      setErrorMsg('Please enter a valid tenure in years.');
      return;
    }
    if (t <= 0 || t > 50) {
      setErrorMsg('Tenure must be between 1 and 50 years.');
      return;
    }

    executeCalculation(p, r, t);
  };

  const handleReset = () => {
    setPrincipal(String(DEFAULT_PRINCIPAL));
    setAnnualRate(String(DEFAULT_RATE));
    setTenureYears(String(DEFAULT_TENURE));
    setErrorMsg(null);
    executeCalculation(DEFAULT_PRINCIPAL, DEFAULT_RATE, DEFAULT_TENURE);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalculate} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Loan Amount ({currencySymbol})
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 200000"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Interest Rate (% p.a.)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
              placeholder="e.g. 7.0"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Tenure (Years)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(e.target.value)}
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
            {isLoading ? 'Calculating...' : 'Calculate EMI'}
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
              <span className="text-[10px] uppercase font-semibold text-text-muted">Monthly EMI</span>
              <p className="text-base font-semibold text-text tabular-nums">
                {currencySymbol}{result.monthly_emi?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Total Interest</span>
              <p className="text-base font-semibold text-accent tabular-nums">
                {currencySymbol}{result.total_interest?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-text-muted">Total Payment</span>
              <p className="text-base font-semibold text-primary tabular-nums">
                {currencySymbol}{result.total_payment?.toLocaleString()}
              </p>
            </div>
          </div>

          <AmortizationChart data={result.chart_data} />

          <button
            onClick={() => onInsertToChat(`I calculated a loan of ${currencySymbol}${Number(principal).toLocaleString()} at ${annualRate}% interest for ${tenureYears} years. My EMI is ${currencySymbol}${result.monthly_emi}. Can you suggest ways to pay this down faster and save on interest?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Discuss this Loan Plan with FinSta
          </button>
        </>
      )}
    </div>
  );
};
