import { motion } from 'motion/react';
import { 
  BarChart3, 
  Download, 
  CheckCircle2, 
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { SectionHeader } from './ui/SectionHeader';
import { Session } from '../types';

export default function ArchiveScreen() {
  const sessions: Session[] = []; // Clear mock data for production-ready state

  return (
    <div className="max-w-7xl mx-auto px-12 py-20">
      <PageHeader 
        title="Learning Archive"
        badge="HISTORICAL RECORD"
        description="A permanent record of intellectual growth and conceptual mastery synthesized through your socratic sessions."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Sidebar: Session List */}
        <div className="lg:col-span-4 space-y-6">
          <SectionHeader label="COMPLETED SESSIONS" className="px-2" />
          
          {sessions.length === 0 ? (
            <div className="py-20 text-center border border-outline-variant/10 rounded-2xl bg-surface-container-lowest/50">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">No records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <Card 
                  key={s.id}
                  variant={s.active ? 'lowest' : 'low'}
                  className={`p-5 group ${s.active ? 'border-primary shadow-ambient' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  hover={!s.active}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={s.active ? 'tertiary' : 'surface'}>
                      BLOOM: {s.bloom}
                    </Badge>
                    <span className="label-md text-[9px] text-on-surface-variant opacity-60">{s.date}</span>
                  </div>
                  <h4 className={`font-manrope font-bold leading-tight ${s.active ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                    {s.title}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant mt-2 line-clamp-1">
                    {s.desc}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Content: Detailed View / Scenario Guide */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-surface-container-low p-12 rounded-2xl border border-outline-variant/10 space-y-10">
            <div className="space-y-4">
              <h2 className="headline-md">The Archive Perimeter</h2>
              <p className="text-on-surface-variant leading-relaxed opacity-70">
                The Archive is more than a storage system; it is a repository of your intellectual evolution. Every session you complete is deconstructed into its constituent insights and mapped onto your longitudinal mastery profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <SectionHeader icon={BarChart3} label="COGNITIVE MAPPING" />
                <p className="text-xs text-on-surface-variant leading-relaxed opacity-60">
                  As you complete sessions, the system tracks your performance across four key dimensions: Abstract Logic, Implementation Speed, Critical Evaluation, and Socratic Reasoning.
                </p>
              </div>
              <div className="space-y-4">
                <SectionHeader icon={Download} label="SYNTHESIS EXPORT" />
                <p className="text-xs text-on-surface-variant leading-relaxed opacity-60">
                  Every session generates a high-fidelity Markdown report. These reports are designed for interoperability with other knowledge management tools (Obsidian, Notion, etc.).
                </p>
              </div>
            </div>

            <div className="pt-10 border-t border-outline-variant/10">
              <div className="flex items-center gap-4 text-primary opacity-40">
                <CheckCircle2 size={20} />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Awaiting first session completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
