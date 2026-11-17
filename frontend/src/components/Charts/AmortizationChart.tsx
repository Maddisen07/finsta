import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useProfile } from '../../context/ProfileContext';

interface AmortizationChartProps {
  data: Array<{
    year: string;
    principal_paid: number;
    interest_paid: number;
    remaining_balance: number;
  }>;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({ data }) => {
  const { currencySymbol } = useProfile();

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full bg-surface rounded-xl p-4 border border-border shadow-warm mt-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Loan Repayment & Balance Over Time
        </h4>
        <span className="text-[11px] text-text-muted">Amortization Schedule</span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E4D3B" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#1E4D3B" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97736" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#D97736" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD3" opacity={0.6} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#24221F' }} stroke="#E2DCD3" />
            <YAxis
              tick={{ fontSize: 11, fill: '#24221F' }}
              stroke="#E2DCD3"
              tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString()}`, '']}
              contentStyle={{ backgroundColor: '#FAF8F5', border: '1px solid #E2DCD3', borderRadius: '12px', color: '#24221F', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#24221F' }} />
            <Area type="monotone" dataKey="remaining_balance" name="Remaining Balance" stroke="#1E4D3B" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
            <Area type="monotone" dataKey="principal_paid" name="Principal Paid" stroke="#D97736" strokeWidth={2} fillOpacity={1} fill="url(#colorPrincipal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
