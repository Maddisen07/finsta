import React from 'react';
import { PiggyBank, Landmark, TrendingUp, CreditCard, Sparkles } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

interface StarterQuestionsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const StarterQuestions: React.FC<StarterQuestionsProps> = ({ onSelectPrompt }) => {
  const { currencySymbol } = useProfile();

  const categories = [
    {
      title: 'Budgeting & Salary',
      icon: PiggyBank,
      questions: [
        `How do I split my ${currencySymbol}4,500 salary with the 50/30/20 budget?`,
        'What should I do if my rent takes up more than 50% of my income?',
      ],
    },
    {
      title: 'Loans & EMI',
      icon: Landmark,
      questions: [
        `Calculate my EMI on a ${currencySymbol}250,000 mortgage at 6.8% for 25 years`,
        'Is it better to prepay my home loan early or invest in index funds?',
      ],
    },
    {
      title: 'SIP & Wealth Growth',
      icon: TrendingUp,
      questions: [
        `What happens if I invest ${currencySymbol}400/month for 20 years at 11% return?`,
        'What is a stock and how do index funds work?',
      ],
    },
    {
      title: 'Debt Payoff & Emergency',
      icon: CreditCard,
      questions: [
        'Compare the Avalanche vs Snowball debt payoff method for high APR cards',
        'How many months of emergency fund do I need and where should I park it?',
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      
      {/* Friendly Greeting Card */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-primary text-xs font-semibold mb-3 shadow-warm">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Meet FinSta • Your Smart Money Sidekick
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          Clear, Friendly Financial Guidance
        </h2>
        <p className="text-base text-text-muted max-w-lg mx-auto mt-2">
          Ask questions about budgeting, loans, compounding, debt payoff, or click any starter prompt below to get started.
        </p>
      </div>

      {/* Starter Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl border border-border bg-surface shadow-warm transition"
            >
              <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-primary">
                <Icon className="w-4 h-4 text-accent" />
                <span>{cat.title}</span>
              </div>
              <div className="space-y-2">
                {cat.questions.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => onSelectPrompt(q)}
                    className="w-full text-left p-2.5 rounded-lg bg-background hover:bg-surface text-sm font-medium text-text border border-border transition flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{q}</span>
                    <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="mt-8 text-center">
        <p className="text-xs text-text-muted">
          🔒 <span className="font-semibold text-text">Privacy First:</span> FinSta never asks for your bank passwords, SSN, or card numbers. Any sensitive data pasted is automatically masked.
        </p>
      </div>

    </div>
  );
};
