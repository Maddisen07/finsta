import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useProfile } from '../../context/ProfileContext';

interface InvestmentGrowthChartProps {
  data: Array<{
    year: string;
    invested: number;
    returns: number;
    total_value: number;
  }>;
}

export const InvestmentGrowthChart: React.FC<InvestmentGrowthChartProps> = ({ data }) => {
  const { currencySymbol } = useProfile();

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full bg-surface rounded-xl p-4 border border-border shadow-warm mt-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Compound Growth Projection
        </h4>
        <span className="text-[11px] text-accent font-semibold">
          Power of Compounding
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5B8A74" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#5B8A74" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97736" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#D97736" stopOpacity={0.05}/>
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
            <Area type="monotone" stackId="1" dataKey="invested" name="Invested Capital" stroke="#5B8A74" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" />
            <Area type="monotone" stackId="1" dataKey="returns" name="Compound Returns" stroke="#D97736" strokeWidth={2} fillOpacity={1} fill="url(#colorReturns)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
