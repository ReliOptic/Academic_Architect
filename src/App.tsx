import { useState } from 'react';
import Layout from './components/Layout';
import ModelSettingsScreen from './components/ModelSettingsScreen';
import DashboardScreen from './components/DashboardScreen';
import LearningScreen from './components/LearningScreen';
import ArchiveScreen from './components/ArchiveScreen';
import LandingPage from './components/LandingPage';
import { AnimatePresence, motion } from 'motion/react';

function readDeepLinkSession(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('session');
  return id && /^[a-zA-Z0-9_-]{4,64}$/.test(id) ? id : null;
}

export default function App() {
  const deepLinkSession = readDeepLinkSession();

  const [isStarted, setIsStarted] = useState(() => {
    if (deepLinkSession) return true;
    return localStorage.getItem('architect_started') === 'true';
  });

  const [activeTab, setActiveTab] = useState(() => {
    if (deepLinkSession) return 'learning';
    const configured = localStorage.getItem('architect_configured') === 'true';
    return configured ? 'dashboard' : 'model-settings';
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(deepLinkSession);

  const handleStart = () => {
    setIsStarted(true);
    localStorage.setItem('architect_started', 'true');
  };

  const handleSettingsApplied = () => {
    localStorage.setItem('architect_configured', 'true');
    setActiveTab('dashboard');
  };

  const handleSessionStart = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab('learning');
  };

  if (!isStarted) {
    return <LandingPage onStart={handleStart} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'model-settings': return <ModelSettingsScreen onApply={handleSettingsApplied} />;
      case 'dashboard': return <DashboardScreen onSessionStart={handleSessionStart} />;
      case 'learning': return <LearningScreen sessionId={activeSessionId} />;
      case 'archive': return <ArchiveScreen />;
      default: return <DashboardScreen onSessionStart={handleSessionStart} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
