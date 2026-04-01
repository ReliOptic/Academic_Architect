import { motion } from 'motion/react';
import { 
  Upload, 
  ArrowRight, 
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { SectionHeader } from './ui/SectionHeader';
import { Session } from '../types';

export default function DashboardScreen() {
  const recentSessions: Session[] = []; // Clear mock data for production-ready state

  return (
    <div className="max-w-7xl mx-auto px-12 py-20">
      <PageHeader 
        title="Learning Dashboard"
        actions={
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-4">
              <span className="ghost-border px-3 py-1 rounded-sm label-md text-[10px] text-on-surface-variant">
                ARCHIVE V1.0.0
              </span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="label-md text-[10px] text-primary">SYSTEM READY</span>
              </div>
            </div>
            <button className="ghost-border px-6 py-2 rounded-sm label-md text-primary hover:bg-primary hover:text-white transition-all">
              INITIATE NEW SYNTHESIS
            </button>
          </div>
        }
      />

      {/* Scenario Planning / Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        <div className="lg:col-span-2">
          <SectionHeader label="SYSTEM SCENARIO" className="text-primary font-bold mb-6" />
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 font-bold text-primary border border-primary/20">01</div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg">Artifact Deposition</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed opacity-70">
                  The user uploads raw intellectual material (transcripts, papers, notes). The system initiates a "Socratic Extraction" process, identifying core signifiers and logical gaps.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 font-bold text-primary border border-primary/20">02</div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg">Architectural Synthesis</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed opacity-70">
                  The synthesis model deconstructs the artifacts into a structured knowledge graph. The user interacts through the "Learning" interface to refine the model's understanding.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 font-bold text-primary border border-primary/20">03</div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg">Archive & Retrieval</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed opacity-70">
                  Completed sessions are archived with a unique identifier. These can be retrieved for future cross-session synthesis or longitudinal learning analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 space-y-6">
          <SectionHeader label="DEPLOYMENT FOCUS" className="text-primary font-bold" />
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Local Persistence</h5>
              <p className="text-xs opacity-60">Session data is stored in the local adapter environment, ensuring zero-leakage of intellectual property.</p>
            </div>
            <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Terminal Integration</h5>
              <p className="text-xs opacity-60">The "Adapter" acts as a bridge to your local filesystem, allowing the AI to read/write artifacts directly to your project folders.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <section className="mb-20">
        <div className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-xl h-64 flex flex-col items-center justify-center group cursor-pointer hover:bg-surface-container-lowest hover:border-primary/30 transition-all relative overflow-hidden">
          <div className="z-10 text-center space-y-4">
            <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mx-auto shadow-ambient group-hover:scale-110 transition-transform">
              <Upload className="text-primary" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="headline-sm">Deposit Study Artifacts</h3>
              <p className="text-on-surface-variant text-xs max-w-md mx-auto leading-relaxed opacity-60">
                Drag and drop your academic archives to initiate synthesis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Sessions */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <SectionHeader label="RECENT SESSIONS" className="text-primary font-bold" />
        </div>

        {recentSessions.length === 0 ? (
          <div className="py-20 text-center border border-outline-variant/10 rounded-2xl bg-surface-container-lowest/50">
            <p className="text-on-surface-variant text-sm italic opacity-40">No active synthesis sessions found. Initiate a new session to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentSessions.map((session) => (
              <Card 
                key={session.id}
                className="group cursor-pointer hover:bg-surface-container-lowest p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="surface">{session.date}</Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <div className="w-1 h-1 rounded-full bg-primary" />
                  </div>
                </div>
                <h3 className="font-manrope font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {session.title}
                </h3>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex -space-x-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-surface-container-highest border-2 border-surface-container-low flex items-center justify-center text-[8px] font-bold">
                        {i === 1 ? 'AI' : 'ME'}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                    {session.archive} ARCHIVE
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
