import { useState } from 'react';
import Layout from './components/Layout';
import ModelSettingsScreen from './components/ModelSettingsScreen';
import DashboardScreen from './components/DashboardScreen';
import LearningScreen from './components/LearningScreen';
import ArchiveScreen from './components/ArchiveScreen';
import LandingPage from './components/LandingPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [isStarted, setIsStarted] = useState(() => {
    return localStorage.getItem('architect_started') === 'true';
  });

  const [activeTab, setActiveTab] = useState(() => {
    const configured = localStorage.getItem('architect_configured') === 'true';
    return configured ? 'dashboard' : 'model-settings';
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

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
      case 'model-settings':
        return (
          <ErrorBoundary fallbackTitle="설정 화면 오류">
            <ModelSettingsScreen onApply={handleSettingsApplied} />
          </ErrorBoundary>
        );
      case 'dashboard':
        return (
          <ErrorBoundary fallbackTitle="대시보드 오류">
            <DashboardScreen onSessionStart={handleSessionStart} />
          </ErrorBoundary>
        );
      case 'learning':
        return (
          <ErrorBoundary fallbackTitle="학습 화면 오류">
            <LearningScreen
              sessionId={activeSessionId}
              onNavigateDashboard={() => setActiveTab('dashboard')}
              onNavigateArchive={() => setActiveTab('archive')}
            />
          </ErrorBoundary>
        );
      case 'archive':
        return (
          <ErrorBoundary fallbackTitle="아카이브 오류">
            <ArchiveScreen />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <DashboardScreen onSessionStart={handleSessionStart} />
          </ErrorBoundary>
        );
    }
  };

  return (
    <ErrorBoundary fallbackTitle="앱 로딩 오류">
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
    </ErrorBoundary>
  );
}
