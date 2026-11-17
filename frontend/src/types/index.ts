export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
};

export interface UserProfile {
  id?: number;
  currency: CurrencyCode;
  monthly_income: number;
  monthly_expenses: number;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  primary_goal: string;
  updated_at?: string;
}

export interface ExtractedEntities {
  amounts?: number[];
  interest_rate?: number | null;
  tenure_months?: number | null;
  tenure_years?: number | null;
  income?: number | null;
  expenses?: number | null;
  loan_amount?: number | null;
  goal_amount?: number | null;
  currency_detected?: CurrencyCode | null;
}

export interface ToolCallExecution {
  tool_call: string;
  tool_result: {
    type: string;
    data: any;
    chart_data?: any;
    error?: string;
  };
}

export interface Message {
  id?: string | number;
  sender: 'user' | 'assistant';
  content: string;
  intent?: string;
  entities?: ExtractedEntities;
  tool_calls?: ToolCallExecution[];
  chart_data?: any;
  created_at?: string;
  pii_warnings?: string[];
  follow_ups?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}
