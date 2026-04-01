import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal as TerminalIcon, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  RefreshCw,
  Play,
  Square,
  Trash2,
  ChevronDown,
  Globe,
  Lock,
  Settings,
  PlugZap,
  Info,
  AlertCircle,
  Code,
  Diamond,
  ChevronRight,
  MousePointer2,
  ArrowLeft,
  ArrowRight,
  Bot
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { SectionHeader } from './ui/SectionHeader';
import { PageHeader } from './ui/PageHeader';
import { LogEntry, Model, Engine } from '../types';

const MODELS: Model[] = [
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'codex-o1', name: 'Codex O1', provider: 'OpenAI' },
  { id: 'openrouter-llama-3', name: 'Llama 3 70B', provider: 'OpenRouter' },
];

const ENGINES: Engine[] = [
  { 
    id: 'claude-code', 
    name: 'Claude Code', 
    icon: TerminalIcon, 
    description: 'Local Claude agent',
    recommended: true
  },
  { 
    id: 'codex', 
    name: 'Codex', 
    icon: Code, 
    description: 'Local Codex agent',
    recommended: true
  },
  { 
    id: 'gemini-cli', 
    name: 'Gemini CLI', 
    icon: Diamond, 
    description: 'Local Gemini agent'
  },
  { 
    id: 'opencode', 
    name: 'OpenCode', 
    icon: Square, 
    description: 'Local multi-provider agent'
  },
  { 
    id: 'pi', 
    name: 'Pi', 
    icon: ChevronRight, 
    description: 'Local Pi agent'
  },
  { 
    id: 'cursor', 
    name: 'Cursor', 
    icon: MousePointer2, 
    description: 'Local Cursor agent'
  },
  { 
    id: 'openclaw-gateway', 
    name: 'OpenClaw Gateway', 
    icon: Bot, 
    description: 'Configure OpenClaw within the App'
  },
];

interface ModelSettingsProps {
  onApply?: () => void;
}

export default function ModelSettingsScreen({ onApply }: ModelSettingsProps) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedEngine, setSelectedEngine] = useState(ENGINES[0]);
  const [showMoreAdapters, setShowMoreAdapters] = useState(true);
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = () => {
    setIsApplied(true);
    if (onApply) {
      setTimeout(() => onApply(), 1500);
    } else {
      setTimeout(() => setIsApplied(false), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      {/* Synthesis Engine */}
      <div className="space-y-6">
        <SectionHeader icon={Settings} label="SYNTHESIS ENGINE" />
        
        {/* Recommended Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ENGINES.filter(e => e.recommended).map((engine) => (
            <button
              key={engine.id}
              onClick={() => setSelectedEngine(engine)}
              className={`relative p-8 rounded-2xl border transition-all text-center flex flex-col items-center gap-4 group ${
                selectedEngine.id === engine.id
                  ? 'bg-surface-container-highest border-primary ring-1 ring-primary shadow-lg'
                  : 'bg-surface-container-low border-outline-variant/10 hover:border-primary/40'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="tertiary" className="bg-status-active text-white border-none shadow-sm px-3 py-1">Recommended</Badge>
              </div>
              <engine.icon size={32} className={selectedEngine.id === engine.id ? 'text-primary' : 'text-on-surface-variant opacity-60'} />
              <div className="space-y-1">
                <div className="font-bold text-lg">{engine.name}</div>
                <div className="text-xs text-on-surface-variant opacity-60">{engine.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* More Engines Toggle */}
        <div className="space-y-4">
          <button 
            onClick={() => setShowMoreAdapters(!showMoreAdapters)}
            className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors ml-1"
          >
            <ChevronDown size={14} className={`transition-transform ${showMoreAdapters ? '' : '-rotate-90'}`} />
            Extended Engine Library
          </button>

          <AnimatePresence>
            {showMoreAdapters && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {ENGINES.filter(e => !e.recommended).map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => setSelectedEngine(engine)}
                    className={`p-6 rounded-2xl border transition-all text-center flex flex-col items-center gap-3 group ${
                      selectedEngine.id === engine.id
                        ? 'bg-surface-container-highest border-primary ring-1 ring-primary shadow-md'
                        : 'bg-surface-container-low border-outline-variant/10 hover:border-primary/40'
                    }`}
                  >
                    <engine.icon size={24} className={selectedEngine.id === engine.id ? 'text-primary' : 'text-on-surface-variant opacity-60'} />
                    <div className="space-y-1">
                      <div className="font-bold text-sm">{engine.name}</div>
                      <div className="text-[10px] text-on-surface-variant opacity-60">{engine.description}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-3">
        <SectionHeader icon={Cpu} label="LLM BACKBONE" />
        <div className="relative">
          <select 
            value={selectedModel.id}
            onChange={(e) => setSelectedModel(MODELS.find(m => m.id === e.target.value) || MODELS[0])}
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-4 pr-12 appearance-none font-bold text-sm text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer shadow-sm"
          >
            <option value="default">Default</option>
            {MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none opacity-40" size={18} />
        </div>
      </div>

      {/* Environment Check */}
      <Card variant="low" hover={false} className="p-6 border-outline-variant/10">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Adapter environment check</h4>
            <p className="text-xs text-on-surface-variant opacity-60 leading-relaxed">
              Runs a live probe that asks the adapter CLI to respond with hello.
            </p>
          </div>
          <button className="px-6 py-2.5 bg-surface-container-highest border border-outline-variant/20 rounded-xl font-bold text-xs hover:bg-surface-container-high transition-colors shadow-sm">
            Test now
          </button>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end pt-6 gap-6">
        <AnimatePresence>
          {isApplied && (
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-[10px] font-bold text-status-active uppercase tracking-[0.2em]"
            >
              Settings Applied Successfully
            </motion.span>
          )}
        </AnimatePresence>
        <button 
          onClick={handleApply}
          className="flex items-center gap-2 px-10 py-4 bg-primary text-on-primary rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
        >
          Apply Settings
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
