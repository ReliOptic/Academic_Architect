import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ModelSettingsScreen from './components/ModelSettingsScreen';
import DashboardScreen from './components/DashboardScreen';
import LearningScreen from './components/LearningScreen';
import ArchiveScreen from './components/ArchiveScreen';
import LandingPage from './components/LandingPage';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [isStarted, setIsStarted] = useState(() => {
    return localStorage.getItem('architect_started') === 'true';
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    const configured = localStorage.getItem('architect_configured') === 'true';
    return configured ? 'dashboard' : 'model-settings';
  });

  const handleStart = () => {
    setIsStarted(true);
    localStorage.setItem('architect_started', 'true');
  };

  const handleSettingsApplied = () => {
    localStorage.setItem('architect_configured', 'true');
    setActiveTab('dashboard');
  };

  if (!isStarted) {
    return <LandingPage onStart={handleStart} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'model-settings': return <ModelSettingsScreen onApply={handleSettingsApplied} />;
      case 'dashboard': return <DashboardScreen />;
      case 'learning': return <LearningScreen />;
      case 'archive': return <ArchiveScreen />;
      default: return <DashboardScreen />;
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
