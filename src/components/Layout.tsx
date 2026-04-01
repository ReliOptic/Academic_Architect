import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutGrid, 
  Settings, 
  User, 
  BookOpen, 
  Terminal, 
  History, 
  Library,
  ChevronRight,
  Bell
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    { id: 'model-settings', label: 'Model Settings' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'learning', label: 'Learning' },
    { id: 'archive', label: 'Archive' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav h-16 flex items-center justify-between px-8 md:px-12">
        <div className="flex items-center gap-12">
          <span className="text-xl font-extrabold tracking-tighter text-primary font-manrope">
            The Academic Architect
          </span>
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
        
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
            <LayoutGrid size={20} />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
            <Settings size={20} />
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/20">
            <img 
              src="https://picsum.photos/seed/scholar/100/100" 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-outline-variant/10 bg-surface flex items-center justify-between px-8 md:px-12 text-[10px] label-md text-on-surface-variant opacity-60">
        <div>© 2024 THE DIGITAL CURATOR • BLOOM LEVEL: ADVANCED</div>
        <div className="flex gap-6">
          <button className="hover:text-primary transition-colors">DOCUMENTATION</button>
          <button className="hover:text-primary transition-colors">API STATUS</button>
          <button className="hover:text-primary transition-colors">SUPPORT</button>
        </div>
      </footer>
    </div>
  );
}
