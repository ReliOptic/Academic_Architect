import { motion } from 'motion/react';
import { ArrowRight, Globe, Shield, Zap } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background Grid - Intellectual Asymmetry */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-on-surface/10" />
          ))}
        </div>
      </div>

      {/* Floating Elements */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
      />

      {/* Content */}
      <div className="z-10 max-w-4xl w-full text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-highest border border-outline-variant/20 shadow-sm mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Architectural Intelligence v1.0
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface leading-[0.9] font-manrope">
            The Academic <br />
            <span className="text-primary italic">Architect</span>
          </h1>
          
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed opacity-80 font-medium">
            A high-fidelity synthesis environment for deconstructing complex information through Socratic dialogue and architectural modeling.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
        >
          <div className="space-y-3 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Globe size={20} />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Local Synthesis</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              Bridge your local terminal environment with advanced inference engines for secure, private data processing.
            </p>
          </div>
          
          <div className="space-y-3 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Shield size={20} />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Secure Adapters</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              Enterprise-grade adapter types ensuring your architectural artifacts remain within your controlled perimeter.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Rapid Extraction</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              Convert raw study artifacts into structured knowledge graphs using high-performance synthesis models.
            </p>
          </div>
        </motion.div>

        {/* Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pt-8"
        >
          <button 
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-12 py-5 bg-on-surface text-surface rounded-2xl font-bold text-lg hover:bg-primary hover:text-white transition-all shadow-2xl overflow-hidden"
          >
            <span className="relative z-10">INITIATE SESSION</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
          
          <p className="mt-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] opacity-40">
            Press to enter the architectural perimeter
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-8 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
          <span>v1.0.4-STABLE</span>
          <div className="w-1 h-1 rounded-full bg-on-surface-variant" />
          <span>ENCRYPTED END-TO-END</span>
          <div className="w-1 h-1 rounded-full bg-on-surface-variant" />
          <span>EST. 2024</span>
        </div>
      </div>
    </div>
  );
}
