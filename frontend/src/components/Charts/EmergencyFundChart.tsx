import React from 'react';
import { useProfile } from '../../context/ProfileContext';

interface EmergencyFundChartProps {
  data: {
    monthly_essential_expenses: number;
    months_target: number;
    target_fund: number;
    current_savings: number;
    funding_gap: number;
    percent_funded: number;
    months_to_complete?: number;
    status: string;
  };
}

export const EmergencyFundChart: React.FC<EmergencyFundChartProps> = ({ data }) => {
  const { currencySymbol } = useProfile();
  if (!data) return null;

  const percent = Math.min(100, Math.max(0, data.percent_funded || 0));

  return (
    <div className="w-full bg-surface rounded-xl p-4 border border-border shadow-warm mt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Emergency Fund Preparedness
        </h4>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-background text-text border border-border">
          {data.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1.5 font-medium tabular-nums">
          <span className="text-text-muted">
            Saved: {currencySymbol}{data.current_savings?.toLocaleString()}
          </span>
          <span className="text-text font-semibold">
            Target: {currencySymbol}{data.target_fund?.toLocaleString()} ({data.months_target} mos)
          </span>
        </div>

        <div className="w-full h-3 bg-background rounded-full overflow-hidden p-0.5 border border-border">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-text-muted mt-1 tabular-nums">
          <span>0%</span>
          <span className="font-semibold text-primary">{percent}% Funded</span>
          <span>100%</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border text-xs">
        <div className="bg-background p-2.5 rounded-lg border border-border">
          <span className="text-text-muted text-[10px] uppercase font-semibold block">Remaining Gap</span>
          <span className="font-semibold text-text text-sm tabular-nums">
            {currencySymbol}{data.funding_gap?.toLocaleString()}
          </span>
        </div>
        <div className="bg-background p-2.5 rounded-lg border border-border">
          <span className="text-text-muted text-[10px] uppercase font-semibold block">Estimated Time</span>
          <span className="font-semibold text-text text-sm tabular-nums">
            {data.months_to_complete ? `~${data.months_to_complete} Months` : 'Depends on monthly savings'}
          </span>
        </div>
      </div>
    </div>
  );
};
