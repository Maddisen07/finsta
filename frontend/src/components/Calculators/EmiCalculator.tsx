import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { AmortizationChart } from '../Charts/AmortizationChart';
import { Send } from 'lucide-react';

interface EmiCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

export const EmiCalculator: React.FC<EmiCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol } = useProfile();
  const [principal, setPrincipal] = useState<number>(200000);
  const [annualRate, setAnnualRate] = useState<number>(7.0);
  const [tenureYears, setTenureYears] = useState<number>(15);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    try {
      const data = await api.calculateEmi({
        principal,
        annual_rate: annualRate,
        tenure_months: tenureYears * 12,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculate();
  }, [principal, annualRate, tenureYears]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Loan Amount ({currencySymbol})
          </label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={annualRate}
            onChange={(e) => setAnnualRate(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Tenure (Years)
          </label>
          <input
            type="number"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>
      </div>

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
            onClick={() => onInsertToChat(`I calculated a loan of ${currencySymbol}${principal.toLocaleString()} at ${annualRate}% interest for ${tenureYears} years. My EMI is ${currencySymbol}${result.monthly_emi}. Can you suggest ways to pay this down faster and save on interest?`)}
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
