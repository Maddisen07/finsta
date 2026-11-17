import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { InvestmentGrowthChart } from '../Charts/InvestmentGrowthChart';
import { Send } from 'lucide-react';

interface SipCalculatorProps {
  onInsertToChat: (prompt: string) => void;
}

export const SipCalculator: React.FC<SipCalculatorProps> = ({ onInsertToChat }) => {
  const { currencySymbol } = useProfile();
  const [monthly, setMonthly] = useState<number>(500);
  const [rate, setRate] = useState<number>(10.0);
  const [years, setYears] = useState<number>(15);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    try {
      const data = await api.calculateSip({
        monthly_investment: monthly,
        annual_return_rate: rate,
        tenure_years: years,
        initial_lump_sum: 0,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculate();
  }, [monthly, rate, years]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Monthly Investment ({currencySymbol})
          </label>
          <input
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Expected Return (% p.a.)
          </label>
          <input
            type="number"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Duration (Years)
          </label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl border border-border bg-surface text-text outline-none focus:ring-2 focus:ring-accent tabular-nums"
          />
        </div>
      </div>

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
            onClick={() => onInsertToChat(`I am projecting a monthly SIP investment of ${currencySymbol}${monthly}/month for ${years} years with an expected return of ${rate}%. How should I allocate this between broad market index funds and bonds based on my risk profile?`)}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-[#C26325] text-[#24221F] font-bold text-xs transition shadow-warm"
          >
            <Send className="w-3.5 h-3.5" />
            Ask FinSta for Asset Allocation Advice
          </button>
        </>
      )}
    </div>
  );
};
