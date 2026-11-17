import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useProfile } from '../../context/ProfileContext';

interface DebtComparisonChartProps {
  data: Array<{
    metric: string;
    Avalanche: number;
    Snowball: number;
  }>;
}

export const DebtComparisonChart: React.FC<DebtComparisonChartProps> = ({ data }) => {
  const { currencySymbol } = useProfile();

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full bg-surface rounded-xl p-4 border border-border shadow-warm mt-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Avalanche vs. Snowball Payoff Comparison
        </h4>
        <span className="text-[11px] text-accent font-semibold">
          Strategy Showdown
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD3" opacity={0.6} />
            <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#24221F' }} stroke="#E2DCD3" />
            <YAxis tick={{ fontSize: 11, fill: '#24221F' }} stroke="#E2DCD3" />
            <Tooltip
              formatter={(value: any, name: any, item: any) => {
                const isMonths = item.payload.metric.includes('Months');
                return [
                  isMonths ? `${value} Months` : `${currencySymbol}${Number(value).toLocaleString()}`,
                  name
                ];
              }}
              contentStyle={{ backgroundColor: '#FAF8F5', border: '1px solid #E2DCD3', borderRadius: '12px', color: '#24221F', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#24221F' }} />
            <Bar dataKey="Avalanche" fill="#1E4D3B" radius={[4, 4, 0, 0]} name="Avalanche (High APR First)" />
            <Bar dataKey="Snowball" fill="#D97736" radius={[4, 4, 0, 0]} name="Snowball (Small Balance First)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
