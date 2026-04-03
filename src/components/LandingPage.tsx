import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Shield, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl"
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
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              탐구 동료 v1.0
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface leading-[0.9] font-manrope">
            같이 <br />
            <span className="text-primary">파헤쳐보자</span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed opacity-80 font-medium">
            학습 자료를 업로드하면, AI 탐구 동료가 핵심 개념을 함께 발견하고
            당신만의 지식 별자리를 만들어갑니다.
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
              <BookOpen size={20} />
            </div>
            <h3 className="font-bold text-sm">대화형 탐구</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              일방적 설명이 아닌, 질문과 발견으로 이루어진 수평적 학습 대화.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Shield size={20} />
            </div>
            <h3 className="font-bold text-sm">로컬 환경</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              모든 데이터가 로컬에서 처리됩니다. 학습 자료가 외부로 유출되지 않습니다.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-sm">지식 별자리</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              탐구한 개념들이 별자리처럼 연결되어 학습 여정을 시각화합니다.
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
            <span className="relative z-10">탐구 시작하기</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
