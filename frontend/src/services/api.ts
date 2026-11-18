import { UserProfile, ChatSession, Message, ToolCallExecution } from '../types';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE = `${rawBase.replace(/\/$/, '')}/api`;

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
              // 5. Completion
              if (data.done && onDone) {
                onDone(data.follow_ups);
              }
            } catch (err) {
              console.error('Failed to parse SSE JSON chunk:', jsonStr, err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (onError) onError(err);
      else console.error('Chat stream error:', err);
    }
  },

  // Save Turn
  async saveChatTurn(turnData: {
    session_id: string;
    user_message: string;
    assistant_message: string;
    intent?: string;
    entities?: any;
    tool_calls?: any[];
    chart_data?: any;
  }) {
    const res = await fetch(`${API_BASE}/chat/save-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turnData),
    });
    return res.json();
  },

  // Sessions CRUD
  async getSessions(): Promise<ChatSession[]> {
    const res = await fetch(`${API_BASE}/chat/sessions`);
    if (!res.ok) return [];
    return res.json();
  },

  async getSession(id: string): Promise<ChatSession> {
    const res = await fetch(`${API_BASE}/chat/sessions/${id}`);
    if (!res.ok) throw new Error('Session not found');
    return res.json();
  },

  async deleteSession(id: string): Promise<void> {
    await fetch(`${API_BASE}/chat/sessions/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      try {
        const rootRes = await fetch(API_BASE.replace(/\/api$/, '') + '/health');
        return rootRes.ok;
      } catch {
        return false;
      }
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

  // Direct Calculators API
  async calculateEmi(data: { principal: number; annual_rate: number; tenure_months: number }) {
    const res = await fetch(`${API_BASE}/calculators/emi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async calculateSip(data: { monthly_investment: number; annual_return_rate: number; tenure_years: number; initial_lump_sum?: number }) {
    const res = await fetch(`${API_BASE}/calculators/sip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async calculateSavingsGoal(data: { target_amount: number; timeline_months: number; current_savings?: number; annual_interest_rate?: number }) {
    const res = await fetch(`${API_BASE}/calculators/savings-goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async calculateBudget(data: { monthly_income: number; needs_pct?: number; wants_pct?: number; savings_pct?: number }) {
    const res = await fetch(`${API_BASE}/calculators/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async calculateDebtPayoff(data: { debts: Array<{ name: string; balance: number; interest_rate: number; min_payment: number }>; extra_monthly_payment?: number }) {
    const res = await fetch(`${API_BASE}/calculators/debt-payoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async calculateEmergencyFund(data: { monthly_essential_expenses: number; months_target?: number; current_savings?: number; monthly_savings_capacity?: number }) {
    const res = await fetch(`${API_BASE}/calculators/emergency-fund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
