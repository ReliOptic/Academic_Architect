import { type ReactNode, useState } from 'react';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'model-settings', label: '설정' },
  { id: 'dashboard', label: '대시보드' },
  { id: 'learning', label: '학습' },
  { id: 'archive', label: '아카이브' },
];

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav h-16 flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-6 md:gap-12">
          <span className="text-lg md:text-xl font-extrabold tracking-tighter text-primary font-manrope">
            탐구 동료
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8" role="tablist" aria-label="메인 네비게이션">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                role="tab"
                aria-selected={activeTab === item.id}
                className={`text-sm font-semibold tracking-tight transition-all relative py-1 ${
                  activeTab === item.id
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
          aria-label="메뉴"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-on-surface/20" onClick={() => setMobileMenuOpen(false)} />
          <div id="mobile-nav-menu" role="tablist" aria-label="메인 네비게이션" className="absolute top-16 left-0 right-0 bg-surface border-b border-outline-variant/10 shadow-lg">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                role="tab"
                aria-selected={activeTab === item.id}
                className={`w-full px-6 py-4 text-left text-sm font-semibold transition-colors ${
                  activeTab === item.id
                    ? 'text-primary bg-primary/5'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pt-16" role="tabpanel">
        {children}
      </main>
    </div>
  );
}
