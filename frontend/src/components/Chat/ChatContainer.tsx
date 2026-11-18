import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatSession } from '../../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { StarterQuestions } from './StarterQuestions';
import { ChatInput } from './ChatInput';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../services/api';
import { History, Plus, Trash2, Sparkles, MessageSquare, Edit2, Check, X } from 'lucide-react';

interface ChatContainerProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenExport?: () => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  triggerNewChat: boolean;
  onResetNewChatTrigger: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  initialPrompt,
  onClearInitialPrompt,
  activeSessionId,
  setActiveSessionId,
  triggerNewChat,
  onResetNewChatTrigger,
}) => {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Rename session inline state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Load Sessions list
  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data || []);
      return data || [];
    } catch (e) {
      console.warn('Could not load sessions:', e);
      return [];
    }
  };

  // Restore last conversation after a page refresh
  useEffect(() => {
    const restoreConversation = async () => {
      const allSessions = await loadSessions();
      const savedSessionId = localStorage.getItem('finsta_last_session_id') || activeSessionId;

      if (savedSessionId) {
        try {
          const sess = await api.getSession(savedSessionId);
          if (sess && sess.id) {
            setActiveSessionId(sess.id);
            setMessages(sess.messages || []);
            return;
          }
        } catch (e) {
          console.warn('Saved session not found on server:', savedSessionId);
        }
      }

      // If no valid saved session, load the most recent session if available
      if (allSessions && allSessions.length > 0) {
        try {
          const mostRecent = allSessions[0];
          const sess = await api.getSession(mostRecent.id);
          if (sess && sess.id) {
            setActiveSessionId(sess.id);
            setMessages(sess.messages || []);
            localStorage.setItem('finsta_last_session_id', sess.id);
          }
        } catch (e) {
          console.warn('Could not load most recent session:', e);
        }
      }
    };

    restoreConversation();
  }, []);

  // Switch session
  const selectSession = async (sessionId: string) => {
    try {
      const sess = await api.getSession(sessionId);
      setActiveSessionId(sess.id);
      localStorage.setItem('finsta_last_session_id', sess.id);
      setMessages(sess.messages || []);
      setIsHistoryOpen(false);
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  };

  // New Chat handler
  const startNewChat = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveSessionId(null);
    localStorage.removeItem('finsta_last_session_id');
    setMessages([]);
    setIsStreaming(false);
    setIsHistoryOpen(false);
  };

  useEffect(() => {
    if (triggerNewChat) {
      startNewChat();
      onResetNewChatTrigger();
    }
  }, [triggerNewChat]);

  // Handle Initial Prompt if passed from calculators
  useEffect(() => {
    if (initialPrompt && !isStreaming) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  // Start Rename inline
  const startRenaming = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title || 'New Conversation');
  };

  // Save Rename inline
  const saveRename = async (sessionId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editingTitle.trim()) return;

    try {
      await api.renameSession(sessionId, editingTitle.trim());
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: editingTitle.trim() } : s))
      );
      setEditingSessionId(null);
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteSession(sessionId);
      if (activeSessionId === sessionId) {
        startNewChat();
      }
      loadSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Send Message
  const handleSendMessage = async (text: string) => {
    if (isStreaming || !text.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let assistantText = '';
    let currentIntent: string | undefined = undefined;
    let currentEntities: any = undefined;
    let toolCalls: any[] = [];
    let piiWarnings: string[] = [];
    let followUps: string[] = [];

    // Capture mutable reference to session ID so first message reliably saves
    let currentSessionId = activeSessionId;

    const assistantMessageIndex = messages.length + 1;

    setMessages((prev) => [
      ...prev,
      {
        sender: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      },
    ]);

    await api.streamChat({
      message: text,
      sessionId: currentSessionId || undefined,
      currency: profile.currency,
      userProfile: profile,
      signal: abortController.signal,
      onSessionCreated: (id) => {
        currentSessionId = id;
        setActiveSessionId(id);
        localStorage.setItem('finsta_last_session_id', id);
      },
      onPiiWarning: (warns) => {
        piiWarnings = warns;
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantMessageIndex]) {
            updated[assistantMessageIndex].pii_warnings = warns;
          }
          return updated;
        });
      },
      onInit: (initData) => {
        currentIntent = initData.intent;
        currentEntities = initData.entities;
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantMessageIndex]) {
            updated[assistantMessageIndex].intent = initData.intent;
            updated[assistantMessageIndex].entities = initData.entities;
          }
          return updated;
        });
      },
      onChunk: (chunk) => {
        assistantText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantMessageIndex]) {
            updated[assistantMessageIndex].content = assistantText;
          }
          return updated;
        });
      },
      onToolCall: (tc) => {
        toolCalls.push(tc);
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantMessageIndex]) {
            updated[assistantMessageIndex].tool_calls = [...toolCalls];
          }
          return updated;
        });
      },
      onDone: async (suggestedFollowUps) => {
        followUps = suggestedFollowUps || [];
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantMessageIndex]) {
            updated[assistantMessageIndex].follow_ups = followUps;
          }
          return updated;
        });
        setIsStreaming(false);

        // Persist turn to SQLite database
        if (currentSessionId) {
          try {
            await api.saveChatTurn({
              session_id: currentSessionId,
              user_message: text,
              assistant_message: assistantText,
              intent: currentIntent,
              entities: currentEntities,
              tool_calls: toolCalls,
            });
            loadSessions();
          } catch (e) {
            console.error('Failed to save turn to backend SQLite:', e);
          }
        }
      },
      onError: (err) => {
        console.error('Streaming failed:', err);
        setIsStreaming(false);
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const fallbackMsg = isLocal
          ? "Can't reach the FinSta server. Make sure the backend is running on http://localhost:8000"
          : "Can't reach the FinSta server. If running on Render free tier, the backend might be spinning up from sleep (~30-50s). Please retry in a moment.";
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantMessageIndex]) {
            updated[assistantMessageIndex].content = assistantText || fallbackMsg;
          }
          return updated;
        });
      },
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  // Summarize chat
  const handleSummarize = async () => {
    if (!activeSessionId || isSummarizing || messages.length < 2) return;
    try {
      setIsSummarizing(true);
      const res = await api.summarizeSession(activeSessionId);
      if (res && res.summary) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            content: res.summary,
            intent: 'general',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem-2.5rem)] relative overflow-hidden bg-background">
      
      {/* Top Floating Utility Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/90 backdrop-blur-sm z-10">
        
        {/* History drawer toggle */}
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-text hover:bg-surface border border-border transition shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-primary" />
          <span>Conversations ({sessions.length})</span>
        </button>

        {/* Summarize Conversation Button */}
        {messages.length >= 2 && (
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface text-text hover:border-accent border border-border transition shadow-warm"
            title="Summarize key takeaways from this chat"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{isSummarizing ? 'Summarizing...' : 'Summarize Chat'}</span>
          </button>
        )}
      </div>

      {/* History Sidebar Drawer */}
      {isHistoryOpen && (
        <div className="absolute inset-y-0 left-0 w-80 bg-surface border-r border-border z-20 shadow-warm flex flex-col animate-in slide-in-from-left duration-200">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Chat History
            </span>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="text-xs text-text-muted hover:text-text font-semibold p-1"
            >
              Close
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={() => {
                startNewChat();
                setIsHistoryOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-accent text-[#24221F] text-xs font-bold shadow-warm hover:bg-[#C26325] transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> New Conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-text-muted p-4 text-center">No past chats yet.</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition ${
                    activeSessionId === s.id
                      ? 'bg-background text-primary font-bold border border-border shadow-sm'
                      : 'text-text hover:bg-background'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-2">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-primary" />
                    {editingSessionId === s.id ? (
                      <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(s.id, e)}
                          autoFocus
                          className="w-full text-xs font-semibold px-1.5 py-0.5 rounded border border-accent bg-background text-text outline-none"
                        />
                        <button
                          onClick={(e) => saveRename(s.id, e)}
                          className="p-1 hover:text-primary transition"
                          title="Save title"
                        >
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(null);
                          }}
                          className="p-1 hover:text-accent transition"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5 text-text-muted" />
                        </button>
                      </div>
                    ) : (
                      <span className="truncate">{s.title || 'New Conversation'}</span>
                    )}
                  </div>

                  {editingSessionId !== s.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button
                        onClick={(e) => startRenaming(s, e)}
                        className="p-1 text-text-muted hover:text-primary transition rounded"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="p-1 text-text-muted hover:text-accent transition rounded"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-background">
        {messages.length === 0 ? (
          <StarterQuestions onSelectPrompt={handleSendMessage} />
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((m, idx) => (
              <MessageBubble
                key={idx}
                message={m}
                onFollowUpClick={handleSendMessage}
              />
            ))}
            {isStreaming && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky Bottom Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        onStopStreaming={handleStopStreaming}
      />

    </div>
  );
};
