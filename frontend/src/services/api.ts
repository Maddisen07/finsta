import { UserProfile, ChatSession, Message, ToolCallExecution } from '../types';
import {
  calculateEmiLocal,
  calculateSipLocal,
  calculateBudgetLocal,
  calculateSavingsGoalLocal,
  calculateDebtPayoffLocal,
  calculateEmergencyFundLocal,
} from '../utils/localCalculators';

// Smart API base resolution:
// 1. If VITE_API_URL is configured (e.g. in Vercel environment variables), use it.
// 2. If running on a deployed domain (e.g. *.vercel.app), default to the live Render backend.
// 3. Otherwise (localhost / 127.0.0.1 development), default to http://localhost:8000.
export const getApiBase = (): string => {
  const custom = import.meta.env.VITE_API_URL;
  if (custom && custom.trim() !== '') {
    const trimmed = custom.trim().replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://finsta-drrl.onrender.com/api';
  }
  return 'http://localhost:8000/api';
};

export const API_BASE = getApiBase();

export const api = {
  // Chat Streaming via SSE
  async streamChat({
    message,
    sessionId,
    currency,
    userProfile,
    onSessionCreated,
    onInit,
    onChunk,
    onToolCall,
    onPiiWarning,
    onDone,
    onError,
    signal,
  }: {
    message: string;
    sessionId?: string;
    currency: string;
    userProfile?: UserProfile;
    onSessionCreated?: (id: string) => void;
    onInit?: (data: { intent: string; confidence: number; entities: any }) => void;
    onChunk?: (text: string) => void;
    onToolCall?: (toolExecution: ToolCallExecution) => void;
    onPiiWarning?: (warnings: string[]) => void;
    onDone?: (followUps?: string[]) => void;
    onError?: (err: any) => void;
    signal?: AbortSignal;
  }) {
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message,
          currency,
          user_profile: userProfile,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Chat request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            try {
              const data = JSON.parse(jsonStr);

              // 1. Initial metadata
              if (data.session_id && onSessionCreated) {
                onSessionCreated(data.session_id);
              }
              if (data.pii_warnings && data.pii_warnings.length > 0 && onPiiWarning) {
                onPiiWarning(data.pii_warnings);
              }
              // 2. Intent & entities
              if (data.intent && onInit) {
                onInit({
                  intent: data.intent,
                  confidence: data.confidence,
                  entities: data.entities,
                });
              }
              // 3. Text chunk
              if (data.chunk && onChunk) {
                onChunk(data.chunk);
              }
              // 4. Tool call & chart data
              if (data.tool_call && onToolCall) {
                onToolCall({
                  tool_call: data.tool_call,
                  tool_result: data.tool_result,
                });
              }
              // 5. Done event
              if (data.done) {
                if (onDone) onDone(data.suggested_follow_ups);
              }
            } catch (e) {
              console.error('Error parsing SSE event chunk:', e, jsonStr);
            }
          }
        }
      }
    } catch (err: any) {
      if (onError) onError(err);
      else throw err;
    }
  },

  // Save chat turn
  async saveChatTurn(turnData: {
    session_id: string;
    user_message: string;
    assistant_message: string;
    intent?: string;
    entities?: any;
    tool_calls?: any[];
    chart_data?: any;
  }) {
    try {
      const res = await fetch(`${API_BASE}/chat/save-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(turnData),
      });
      return await res.json();
    } catch (e) {
      console.warn('Could not save turn to remote backend:', e);
      return null;
    }
  },

  // Sessions CRUD
  async getSessions(): Promise<ChatSession[]> {
    try {
      const res = await fetch(`${API_BASE}/chat/sessions`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('Could not fetch sessions from remote backend:', e);
      return [];
    }
  },

  async getSession(id: string): Promise<ChatSession> {
    const res = await fetch(`${API_BASE}/chat/sessions/${id}`);
    if (!res.ok) throw new Error('Session not found');
    return res.json();
  },

  async deleteSession(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/chat/sessions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Could not delete session on backend:', e);
    }
  },

  async renameSession(id: string, title: string): Promise<{ id: string; title: string }> {
    const res = await fetch(`${API_BASE}/chat/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to rename session');
    return res.json();
  },

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return true;
    } catch {}

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const rootBase = API_BASE.replace(/\/api$/, '');
      const rootRes = await fetch(`${rootBase}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return rootRes.ok;
    } catch {
      return false;
    }
  },

  // Summarize
  async summarizeSession(sessionId: string): Promise<{ summary: string; session_title: string }> {
    const res = await fetch(`${API_BASE}/chat/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (!res.ok) throw new Error('Failed to summarize session');
    return res.json();
  },

  // Profile CRUD
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async clearUserData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/profile`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear user data');
    return res.json();
  },

  // Direct Calculators API with robust local mathematical fallback
  async calculateEmi(data: { principal: number; annual_rate: number; tenure_months: number }) {
    try {
      const res = await fetch(`${API_BASE}/calculators/emi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend EMI calculation failed, falling back to local calculation engine:', e);
    }
    return calculateEmiLocal(data.principal, data.annual_rate, data.tenure_months);
  },

  async calculateSip(data: {
    monthly_investment: number;
    annual_return_rate: number;
    tenure_years: number;
    initial_lump_sum?: number;
  }) {
    try {
      const res = await fetch(`${API_BASE}/calculators/sip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend SIP calculation failed, falling back to local calculation engine:', e);
    }
    return calculateSipLocal(
      data.monthly_investment,
      data.annual_return_rate,
      data.tenure_years,
      data.initial_lump_sum || 0
    );
  },

  async calculateSavingsGoal(data: {
    target_amount: number;
    timeline_months: number;
    current_savings?: number;
    annual_interest_rate?: number;
  }) {
    try {
      const res = await fetch(`${API_BASE}/calculators/savings-goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend savings goal calculation failed, falling back to local calculation engine:', e);
    }
    return calculateSavingsGoalLocal(
      data.target_amount,
      data.timeline_months,
      data.current_savings || 0,
      data.annual_interest_rate || 0
    );
  },

  async calculateBudget(data: {
    monthly_income: number;
    needs_pct?: number;
    wants_pct?: number;
    savings_pct?: number;
  }) {
    try {
      const res = await fetch(`${API_BASE}/calculators/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend budget calculation failed, falling back to local calculation engine:', e);
    }
    return calculateBudgetLocal(
      data.monthly_income,
      data.needs_pct ?? 50,
      data.wants_pct ?? 30,
      data.savings_pct ?? 20
    );
  },

  async calculateDebtPayoff(data: {
    debts: Array<{ name: string; balance: number; interest_rate: number; min_payment: number }>;
    extra_monthly_payment?: number;
  }) {
    try {
      const res = await fetch(`${API_BASE}/calculators/debt-payoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend debt payoff calculation failed, falling back to local calculation engine:', e);
    }
    return calculateDebtPayoffLocal(data.debts, data.extra_monthly_payment || 0);
  },

  async calculateEmergencyFund(data: {
    monthly_essential_expenses: number;
    months_target?: number;
    current_savings?: number;
    monthly_savings_capacity?: number;
  }) {
    try {
      const res = await fetch(`${API_BASE}/calculators/emergency-fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend emergency fund calculation failed, falling back to local calculation engine:', e);
    }
    return calculateEmergencyFundLocal(
      data.monthly_essential_expenses,
      data.months_target || 6,
      data.current_savings || 0,
      data.monthly_savings_capacity || 0
    );
  },
};
