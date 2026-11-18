import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { ChatContainer } from './components/Chat/ChatContainer';
import { CalculatorModal } from './components/Calculators/CalculatorModal';
import { ProfileModal } from './components/Profile/ProfileModal';
import { ExportModal } from './components/Modals/ExportModal';

export const AppContent: React.FC = () => {
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('finsta_last_session_id');
    } catch {
      return null;
    }
  });
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);
  const [triggerNewChat, setTriggerNewChat] = useState<boolean>(false);

  const handleInsertFromCalculator = (prompt: string) => {
    setPendingPrompt(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text transition-colors">
      {/* Top Header */}
      <Header
        onOpenCalculators={() => setIsCalculatorsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onNewChat={() => setTriggerNewChat(true)}
      />

      {/* Main Chat Flow */}
      <main className="flex-1 flex flex-col">
        <ChatContainer
          initialPrompt={pendingPrompt}
          onClearInitialPrompt={() => setPendingPrompt(undefined)}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          triggerNewChat={triggerNewChat}
          onResetNewChatTrigger={() => setTriggerNewChat(false)}
        />
      </main>

      {/* Educational Disclaimer Footer */}
      <Footer />

      {/* Modals */}
      <CalculatorModal
        isOpen={isCalculatorsOpen}
        onClose={() => setIsCalculatorsOpen(false)}
        onInsertToChat={handleInsertFromCalculator}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        activeSessionId={activeSessionId}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <AppContent />
      </ProfileProvider>
    </ThemeProvider>
  );
};

export default App;
