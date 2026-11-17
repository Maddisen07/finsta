import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { useProfile } from '../../context/ProfileContext';

interface BudgetPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

// Exactly from Warm Light Fintech palette: Deep Forest #1E4D3B, Terracotta #D97736, Sage Tint #5B8A74
const COLORS = ['#1E4D3B', '#D97736', '#5B8A74'];

export const BudgetPieChart: React.FC<BudgetPieChartProps> = ({ data }) => {
  const { currencySymbol } = useProfile();

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full bg-surface rounded-xl p-4 border border-border shadow-warm mt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          50/30/20 Budget Breakdown
        </h4>
        <span className="text-[11px] text-text-muted">Monthly Allocation</span>
      </div>

      <div className="h-56 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString()}`, '']}
              contentStyle={{ backgroundColor: '#FAF8F5', border: '1px solid #E2DCD3', borderRadius: '12px', color: '#24221F', fontSize: '12px' }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#24221F' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
