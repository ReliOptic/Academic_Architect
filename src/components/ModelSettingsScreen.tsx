import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Terminal as TerminalIcon, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { SectionHeader } from './ui/SectionHeader';

interface ModelSettingsProps {
  onApply?: () => void;
}

export default function ModelSettingsScreen({ onApply }: ModelSettingsProps) {
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`서버 응답 실패 (${res.status})`);
      const data = await res.json();
      if (data.llm_ready) {
        setTestResult({
          ok: true,
          message: `연결 성공 — ${data.backend} 백엔드, CLI: ${data.cli_path || '감지됨'}`,
        });
      } else {
        setTestResult({
          ok: false,
          message: 'Claude CLI가 감지되지 않았습니다. 터미널에서 `claude --version`을 확인하세요.',
        });
      }
    } catch (e: unknown) {
      setTestResult({
        ok: false,
        message: `백엔드 서버에 연결할 수 없습니다. ./AA --onboard로 서버를 시작하세요.`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleApply = () => {
    setIsApplied(true);
    if (onApply) {
      setTimeout(() => onApply(), 1000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="headline-md">환경 설정</h1>
        <p className="text-sm text-on-surface-variant opacity-70">
          학습을 시작하기 전에 백엔드 연결 상태를 확인합니다.
        </p>
      </div>

      {/* Engine */}
      <div className="space-y-4">
        <SectionHeader icon={TerminalIcon} label="학습 엔진" />
        <Card variant="lowest" hover={false} className="p-8 text-center space-y-4 border-primary/20">
          <TerminalIcon size={32} className="mx-auto text-primary" />
          <div>
            <div className="font-bold text-lg">Claude Code</div>
            <div className="text-xs text-on-surface-variant opacity-60">
              로컬 Claude CLI를 통한 학습 — 구독 기반, API 키 불필요
            </div>
          </div>
          <Badge variant="tertiary" className="bg-status-active text-white border-none">
            현재 지원
          </Badge>
        </Card>
      </div>

      {/* Connection Test */}
      <Card variant="low" hover={false} className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-bold text-sm">백엔드 연결 테스트</h4>
            <p className="text-xs text-on-surface-variant opacity-60 leading-relaxed">
              FastAPI 서버와 Claude CLI 연결 상태를 확인합니다.
            </p>
          </div>
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-6 py-2.5 bg-surface-container-highest border border-outline-variant/20 rounded-xl font-bold text-xs hover:bg-surface-container-high transition-colors shadow-sm disabled:opacity-50"
          >
            {testing ? '확인 중...' : '테스트'}
          </button>
        </div>
        {testResult && (
          <div
            className={`rounded-xl p-3 text-xs flex items-start gap-2 ${
              testResult.ok ? 'bg-status-active/10 text-tertiary' : 'bg-error/10 text-error'
            }`}
            role="alert"
          >
            {testResult.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
            {testResult.message}
          </div>
        )}
      </Card>

      {/* Apply */}
      <div className="flex items-center justify-end pt-4 gap-6">
        <AnimatePresence>
          {isApplied && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-xs font-bold text-status-active uppercase tracking-widest"
            >
              설정 완료
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={handleApply}
          className="flex items-center gap-2 px-10 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
        >
          대시보드로 이동
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
