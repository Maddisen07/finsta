import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Copy, Check, ShieldAlert, ArrowRight } from 'lucide-react';
import { Message } from '../../types';
import { AmortizationChart } from '../Charts/AmortizationChart';
import { InvestmentGrowthChart } from '../Charts/InvestmentGrowthChart';
import { BudgetPieChart } from '../Charts/BudgetPieChart';
import { DebtComparisonChart } from '../Charts/DebtComparisonChart';
import { EmergencyFundChart } from '../Charts/EmergencyFundChart';

interface MessageBubbleProps {
  message: Message;
  onFollowUpClick?: (question: string) => void;
}

const INTENT_LABELS: Record<string, string> = {
  budgeting: 'Budgeting & Planning',
  savings: 'Savings & Emergency Fund',
  loans: 'Loans & EMI',
  investments: 'Investments & Wealth',
  retirement: 'Retirement Planning',
  debt: 'Debt Payoff Strategy',
  taxes_basic: 'Tax Basics',
  general: 'Personal Finance',
  out_of_scope: 'Out of Scope',
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFollowUpClick }) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const intentLabel = message.intent ? (INTENT_LABELS[message.intent] || 'Finance') : null;

  return (
    <div className={`flex items-start gap-3.5 w-full px-1 sm:px-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6 group`}>
      
      {/* Avatar */}
      <div
        className={`w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center shrink-0 shadow-warm font-bold text-sm select-none ${
          isUser
            ? 'bg-surface text-text border border-border'
            : 'bg-primary text-cream border border-primary/20'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-text" /> : 'F'}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* PII Warning Banner */}
        {message.pii_warnings && message.pii_warnings.length > 0 && (
          <div className="mb-2 p-2.5 rounded-lg bg-surface border border-accent/40 text-text text-xs flex items-center gap-2 shadow-warm">
            <ShieldAlert className="w-4 h-4 shrink-0 text-accent" />
            <span>{message.pii_warnings[0]}</span>
          </div>
        )}

        {/* Intent Badge */}
        {!isUser && intentLabel && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface text-primary border border-border">
              {intentLabel}
            </span>
          </div>
        )}

        {/* Text Content */}
        <div
          className={`rounded-2xl px-5 py-3.5 text-base relative shadow-warm border border-border leading-relaxed ${
            isUser
              ? 'bg-surface text-text rounded-tr-sm'
              : 'bg-background text-text rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-primary prose-p:text-text prose-p:leading-relaxed prose-li:text-text prose-strong:text-text prose-strong:font-semibold prose-table:text-sm prose-table:border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Copy Button */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 p-1 rounded-md bg-surface text-text-muted hover:text-text border border-border opacity-0 group-hover:opacity-100 transition"
              title="Copy response"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Inline Charts if Tool Call Executed */}
        {!isUser && message.tool_calls && message.tool_calls.map((tc, index) => {
          const res = tc.tool_result;
          if (!res) return null;

          if (tc.tool_call === 'calculate_emi' && res.chart_data) {
            return <AmortizationChart key={index} data={res.chart_data} />;
          }
          if (tc.tool_call === 'calculate_sip' && res.chart_data) {
            return <InvestmentGrowthChart key={index} data={res.chart_data} />;
          }
          if (tc.tool_call === 'calculate_budget_50_30_20' && res.chart_data) {
            return <BudgetPieChart key={index} data={res.chart_data} />;
          }
          if (tc.tool_call === 'calculate_debt_payoff' && res.chart_data) {
            return <DebtComparisonChart key={index} data={res.chart_data} />;
          }
          if (tc.tool_call === 'calculate_emergency_fund' && res.data) {
            return <EmergencyFundChart key={index} data={res.data} />;
          }
          return null;
        })}

        {/* Follow-up question suggestion chips */}
        {!isUser && message.follow_ups && message.follow_ups.length > 0 && onFollowUpClick && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.follow_ups.map((fu, fIdx) => (
              <button
                key={fIdx}
                onClick={() => onFollowUpClick(fu)}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface text-text hover:border-accent hover:text-accent border border-border transition flex items-center gap-1.5 shadow-warm"
              >
                <span>{fu}</span>
                <ArrowRight className="w-3 h-3 text-text-muted" />
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
