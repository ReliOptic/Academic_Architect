import { useState } from 'react';
import { 
  Terminal, 
  FileCode, 
  Library,
  Plus,
  ArrowUp,
  Activity,
  Tally3,
  BarChart3,
  Map,
  Save
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { SectionHeader } from './ui/SectionHeader';

export default function LearningScreen() {
  const [messages, setMessages] = useState<any[]>([]); // Empty messages for production-ready state

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-surface-container-low border-r border-outline-variant/5 flex flex-col py-8">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-ambient">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="font-manrope font-bold text-lg leading-tight">Learning Agent</h2>
              <p className="label-md text-[9px] text-tertiary">SYSTEM READY</p>
            </div>
          </div>
          <button className="w-full primary-gradient text-white py-3 rounded-full label-md text-xs font-bold shadow-ambient hover:scale-[1.02] transition-transform">
            NEW SESSION
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { icon: Terminal, label: 'Connection' },
            { icon: FileCode, label: 'Scripts' },
            { icon: Activity, label: 'Socratic Session', active: true },
            { icon: Library, label: 'Library' },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all ${
                item.active 
                  ? 'bg-surface-container-lowest text-primary border-r-4 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-6 mt-auto space-y-4">
          <div className="flex items-center justify-between label-md text-[9px] text-on-surface-variant">
            <span>TOKEN USAGE</span>
            <span className="text-tertiary">0</span>
          </div>
          <div className="flex items-center justify-between label-md text-[9px] text-on-surface-variant">
            <span>SYSTEM HEALTH</span>
            <span className="text-tertiary">OPTIMAL</span>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <section className="flex-1 flex flex-col bg-surface-container-low relative">
        <header className="h-20 px-10 flex items-center justify-between bg-surface-container-lowest/50 backdrop-blur-md border-b border-outline-variant/5">
          <div>
            <div className="label-md text-[9px] text-on-surface-variant uppercase tracking-widest">Active Session</div>
            <h1 className="headline-md">Awaiting Synthesis...</h1>
          </div>
          <Badge variant="surface" className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant opacity-40" />
            LEVEL: PENDING
          </Badge>
        </header>

        {/* Empty State / Scenario Guide */}
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-8">
          <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-primary/40 border border-primary/10">
            <Activity size={48} />
          </div>
          <div className="max-w-md space-y-4">
            <h3 className="headline-sm">Socratic Dialogue Interface</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed opacity-60">
              Once an artifact is deposited, the Learning Agent will initiate a structured dialogue. This is not a standard chat; it is a pedagogical tool designed to probe your understanding of the synthesized material.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5 text-left">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Extraction</h5>
                <p className="text-[10px] opacity-60">The AI identifies key concepts from your local files.</p>
              </div>
              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5 text-left">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Refinement</h5>
                <p className="text-[10px] opacity-60">You refine the knowledge graph through conversation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-8">
          <div className="max-w-3xl mx-auto relative opacity-40 pointer-events-none">
            <textarea 
              className="w-full bg-surface-container-lowest ghost-border rounded-full px-8 py-4 pr-16 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Synthesize your response..."
              rows={1}
              disabled
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Sidebar */}
      <aside className="w-96 bg-surface border-l border-outline-variant/5 p-8 space-y-10 overflow-y-auto">
        {/* Mastery Matrix */}
        <div className="space-y-4">
          <SectionHeader icon={BarChart3} label="MASTERY MATRIX" />
          <Card variant="low" hover={false} className="p-6 space-y-6 opacity-40">
            <div className="flex justify-between items-end">
              <div>
                <div className="font-manrope text-4xl font-extrabold text-on-surface-variant">L0</div>
                <div className="text-xs font-medium text-on-surface-variant">Awaiting Data</div>
              </div>
              <Badge variant="surface">INACTIVE</Badge>
            </div>
            <div className="flex gap-1.5 h-2">
              {[0, 0, 0, 0, 0, 0].map((active, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full bg-surface-container-high`} 
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Path Architecture */}
        <div className="space-y-4">
          <SectionHeader icon={Map} label="PATH ARCHITECTURE" />
          <div className="py-10 text-center border border-outline-variant/10 rounded-2xl bg-surface-container-lowest/50">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">No path generated</p>
          </div>
        </div>

        <button className="w-full py-4 bg-surface-container-high rounded-xl label-md text-[10px] text-on-surface-variant flex items-center justify-center gap-2 opacity-40 cursor-not-allowed">
          <Save size={14} /> ARCHIVE SESSION STATE
        </button>
      </aside>
    </div>
  );
}
