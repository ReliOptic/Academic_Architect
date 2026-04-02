import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  SkipForward,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ArrowLeft,
  Menu,
  X,
  PanelRightOpen,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { useSession } from '../hooks/useSession';
import ChatMessageList from './learning/ChatMessageList';
import ChatInput from './learning/ChatInput';
import StatsSidebar from './learning/StatsSidebar';
import type { Phase } from '../types';

interface Props {
  sessionId: string | null;
  onNavigateDashboard?: () => void;
}

const DEPTH_LABELS: Record<string, { label: string; color: string }> = {
  '표면 탐색': { label: '표면 탐색', color: 'text-on-surface-variant' },
  '구조 파악': { label: '구조 파악', color: 'text-tertiary' },
  '핵심 도달': { label: '핵심 도달', color: 'text-primary' },
  '심층 연결': { label: '심층 연결', color: 'text-status-active' },
};

const PHASE_LABELS: Partial<Record<Phase, string>> = {
  preview: '예측 단계',
  probing: '탐구 질문',
  hinting: '힌트',
  analyzing: '분석 중...',
  delivering: '함께 탐구',
  discussing: '자유 질문',
  challenge_prompt: '통합 도전',
  challenge_feedback: '피드백',
  complete: '완료',
};

export default function LearningScreen({ sessionId, onNavigateDashboard }: Props) {
  const {
    session,
    messages,
    phase,
    loading,
    error,
    loadSession,
    submitPreview,
    skipPreviewPhase,
    startProbe,
    sendAnswer,
    sendDiscuss,
    advanceSegment,
    startChallenge,
    sendChallenge,
    finishChallenge,
    skipChallengePhase,
    constellation,
    refreshConstellation,
    viewingSegmentIndex,
    viewSegment,
    returnToCurrentSegment,
  } = useSession();

  const isReviewing = viewingSegmentIndex !== null;

  const [input, setInput] = useState('');
  const [showSegmentSidebar, setShowSegmentSidebar] = useState(false);
  const [showStatsSidebar, setShowStatsSidebar] = useState(false);
  const [discussCountdown, setDiscussCountdown] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatHeaderRef = useRef<HTMLHeadingElement>(null);
  const probeStartedRef = useRef(false);
  const challengeStartedRef = useRef(false);
  const discussTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const discussIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discussDeadlineRef = useRef<number | null>(null);

  // Load session + constellation
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId).then(() => refreshConstellation());
    }
  }, [sessionId, loadSession, refreshConstellation]);

  // Pending 세션 자동 polling — setup_state가 'pending'이면 3초마다 재조회
  useEffect(() => {
    if (!session || session.setup_state !== 'pending') return;
    const timer = setInterval(() => {
      if (sessionId) loadSession(sessionId);
    }, 3000);
    return () => clearInterval(timer);
  }, [session?.setup_state, sessionId, loadSession]);

  // Reset guards when segment changes
  useEffect(() => {
    probeStartedRef.current = false;
    challengeStartedRef.current = false;
  }, [session?.current_segment_index]);

  // Auto-start probe when entering probing phase with no probe question yet
  useEffect(() => {
    if (phase === 'probing' && session && !loading && !probeStartedRef.current) {
      const hasProbeMsg = messages.some(m => m.phase === 'probing' && m.role === 'assistant');
      if (!hasProbeMsg) {
        probeStartedRef.current = true;
        startProbe();
      }
    }
  }, [phase, session]);

  // Auto-start challenge
  useEffect(() => {
    if (phase === 'challenge_prompt' && session && !loading && !challengeStartedRef.current) {
      const hasChallenge = messages.some(m => m.phase === 'challenge_prompt' && m.role === 'assistant');
      if (!hasChallenge) {
        challengeStartedRef.current = true;
        startChallenge();
      }
    }
  }, [phase, session]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus chat header on segment transition (accessibility)
  useEffect(() => {
    if (session?.current_segment_index !== undefined) {
      chatHeaderRef.current?.focus();
    }
  }, [session?.current_segment_index]);

  // Discuss 30초 자동 종료 타이머
  const clearDiscussTimers = useCallback(() => {
    if (discussTimerRef.current) { clearTimeout(discussTimerRef.current); discussTimerRef.current = null; }
    if (discussIntervalRef.current) { clearInterval(discussIntervalRef.current); discussIntervalRef.current = null; }
    discussDeadlineRef.current = null;
    setDiscussCountdown(null);
  }, []);

  const startDiscussTimer = useCallback(() => {
    clearDiscussTimers();
    const deadline = Date.now() + 30_000;
    discussDeadlineRef.current = deadline;

    // Countdown interval — update every second during last 10s
    discussIntervalRef.current = setInterval(() => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      if (remaining <= 10 && remaining > 0) {
        setDiscussCountdown(remaining);
      } else if (remaining <= 0) {
        setDiscussCountdown(null);
      } else {
        setDiscussCountdown(null);
      }
    }, 1000);

    // Auto-advance at 30s
    discussTimerRef.current = setTimeout(() => {
      clearDiscussTimers();
      advanceSegment();
    }, 30_000);
  }, [clearDiscussTimers, advanceSegment]);

  // Start/stop timer based on phase
  useEffect(() => {
    if (phase === 'discussing' && !isReviewing && !loading) {
      startDiscussTimer();
    } else {
      clearDiscussTimers();
    }
    return () => clearDiscussTimers();
  }, [phase, isReviewing, loading, startDiscussTimer, clearDiscussTimers]);

  // Reset timer on input change (user typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (phase === 'discussing' && !isReviewing && discussDeadlineRef.current) {
      startDiscussTimer();
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    switch (phase) {
      case 'preview':
        await submitPreview(text);
        break;
      case 'probing':
      case 'hinting':
        await sendAnswer(text);
        break;
      case 'discussing':
        await sendDiscuss(text);
        break;
      case 'challenge_prompt':
        await sendChallenge(text);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const activeSeg = session?.segments?.[session.current_segment_index];
  const activeState = session?.segment_states?.[session.current_segment_index];
  const viewingSeg = isReviewing && viewingSegmentIndex !== null ? session?.segments?.[viewingSegmentIndex] : null;
  const viewingState = isReviewing && viewingSegmentIndex !== null ? session?.segment_states?.[viewingSegmentIndex] : null;
  const currentSeg = isReviewing ? viewingSeg : activeSeg;
  const currentState = isReviewing ? viewingState : activeState;
  const isInputActive = !isReviewing && ['preview', 'probing', 'hinting', 'discussing', 'challenge_prompt'].includes(phase);


  if (!sessionId) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center space-y-4">
          <Activity size={48} className="mx-auto text-primary/40" />
          <h3 className="headline-sm">세션을 선택하세요</h3>
          <p className="text-sm text-on-surface-variant opacity-60">
            Dashboard에서 스크립트를 업로드하면 학습이 시작됩니다.
          </p>
          {onNavigateDashboard && (
            <button
              onClick={onNavigateDashboard}
              className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              대시보드로 이동
            </button>
          )}
        </div>
      </div>
    );
  }

  if (session && session.setup_state !== 'ready') {
    const isError = session.setup_state === 'error';
    return (
      <div className="max-w-4xl mx-auto px-8 py-20">
        <Card variant="lowest" hover={false} className="p-10 space-y-8">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="label-md text-[10px] text-on-surface-variant">
                SESSION DIAGNOSTICS
              </div>
              <h1 className="headline-md">
                {isError ? '세션 초기화에 실패했습니다' : '세션을 준비 중입니다'}
              </h1>
              <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                업로드 파일은 저장되었지만, 세그먼트 생성과 학습 루프 초기화가 아직 완료되지 않았습니다.
              </p>
            </div>
            <Badge variant={isError ? 'error' : 'surface'}>
              {isError ? 'ERROR' : 'PENDING'}
            </Badge>
          </div>

          {isError && (
            <div className="rounded-2xl bg-error/10 text-error p-5 flex gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div className="space-y-2">
                <div className="font-bold">실패 원인</div>
                <div className="text-sm whitespace-pre-wrap">
                  {session.error_message || '백엔드에서 세션을 생성하는 중 오류가 발생했습니다.'}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-surface-container-low p-5 space-y-2">
              <CheckCircle2 size={16} className="text-status-active" />
              <div className="font-bold">1. Claude CLI 확인</div>
              <div className="text-xs text-on-surface-variant">
                터미널에서 `claude` 명령이 실제로 동작하는지 먼저 확인합니다.
              </div>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-5 space-y-2">
              <Wrench size={16} className="text-primary" />
              <div className="font-bold">2. Dashboard 상태 확인</div>
              <div className="text-xs text-on-surface-variant">
                대시보드 상단의 AI 연결 상태와 세션 카드의 오류 메시지를 확인합니다.
              </div>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-5 space-y-2">
              <Sparkles size={16} className="text-tertiary" />
              <div className="font-bold">3. 다시 업로드</div>
              <div className="text-xs text-on-surface-variant">
                환경을 바로잡은 뒤 새 세션으로 다시 업로드하는 편이 가장 빠릅니다.
              </div>
            </div>
          </div>

          {onNavigateDashboard && (
            <button
              onClick={onNavigateDashboard}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={16} /> 대시보드로 돌아가기
            </button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden relative">
      {/* Mobile overlay */}
      {(showSegmentSidebar || showStatsSidebar) && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => { setShowSegmentSidebar(false); setShowStatsSidebar(false); }}
        />
      )}

      {/* Sidebar — Segment List */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-surface-container-low border-r border-outline-variant/5 flex flex-col py-8
        transform transition-transform duration-200 ease-in-out
        ${showSegmentSidebar ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:z-auto
      `}>
        <div className="px-6 mb-10">
          <button
            onClick={() => setShowSegmentSidebar(false)}
            className="md:hidden mb-4 p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
            aria-label="세그먼트 목록 닫기"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-ambient">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="font-manrope font-bold text-lg leading-tight truncate">
                {session?.title || 'Loading...'}
              </h2>
              <p className="label-md text-[9px] text-tertiary uppercase">
                {PHASE_LABELS[phase] || phase}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1">
          {session?.segments.map((seg, i) => {
            const st = session.segment_states[i];
            const isCurrent = i === session.current_segment_index;
            const isViewing = viewingSegmentIndex === i;
            const canClick = st?.completed && !isCurrent;
            return (
              <button
                key={seg.id}
                type="button"
                disabled={!canClick && !isCurrent}
                onClick={() => {
                  if (isCurrent && isReviewing) {
                    returnToCurrentSegment();
                  } else if (canClick) {
                    viewSegment(i);
                  }
                  setShowSegmentSidebar(false);
                }}
                className={`w-full text-left px-6 py-3 text-sm transition-all ${
                  isViewing
                    ? 'bg-tertiary/10 text-tertiary border-r-4 border-tertiary'
                    : isCurrent
                    ? 'bg-surface-container-lowest text-primary border-r-4 border-primary'
                    : st?.completed
                    ? 'text-on-surface-variant/80 hover:bg-surface-container-lowest/50 cursor-pointer'
                    : 'text-on-surface-variant/40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono opacity-50">{seg.id}</span>
                  <span className="truncate font-medium">{seg.title}</span>
                </div>
                {st?.completed && (
                  <span className={`text-[9px] font-bold ${DEPTH_LABELS[st.depth_label]?.color || ''}`}>
                    {st.depth_label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-6 mt-auto space-y-4 pt-4 border-t border-outline-variant/5">
          <div className="flex items-center justify-between label-md text-[9px] text-on-surface-variant">
            <span>토큰</span>
            <span className="text-tertiary">
              {((session?.total_input_tokens || 0) + (session?.total_output_tokens || 0)).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between label-md text-[9px] text-on-surface-variant">
            <span>비용</span>
            <span className="text-tertiary">${session?.cost_usd?.toFixed(4) || '0.0000'}</span>
          </div>
          <div className="flex items-center justify-between label-md text-[9px] text-on-surface-variant">
            <span>진행</span>
            <span className="text-tertiary">
              {session?.completed_count || 0}/{session?.segments?.length || 0}
            </span>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <section className="flex-1 flex flex-col bg-surface-container-low relative">
        <header className="h-20 px-4 md:px-10 flex items-center justify-between bg-surface-container-lowest/50 backdrop-blur-md border-b border-outline-variant/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSegmentSidebar(true)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-container-high transition-colors"
              aria-label="세그먼트 목록 열기"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="label-md text-[9px] text-on-surface-variant uppercase tracking-widest">
                {currentSeg ? `파트 ${currentSeg.id}` : '대기 중'}
              </div>
              <h1 ref={chatHeaderRef} tabIndex={-1} className="headline-md outline-none">
                {currentSeg?.title || '세션 로딩 중...'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isReviewing && (
              <button
                onClick={returnToCurrentSegment}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full label-md text-[10px] hover:opacity-90 transition-opacity"
              >
                <ArrowLeft size={12} /> 현재 파트로 돌아가기
              </button>
            )}
            {!isReviewing && phase === 'preview' && (
              <button
                onClick={skipPreviewPhase}
                className="ghost-border px-4 py-2 rounded-full label-md text-[10px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
              >
                <SkipForward size={12} /> 건너뛰기
              </button>
            )}
            {!isReviewing && phase === 'challenge_prompt' && (
              <button
                onClick={skipChallengePhase}
                aria-label="통합 도전 건너뛰기"
                className="ghost-border px-4 py-2 rounded-full label-md text-[10px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
              >
                <SkipForward size={12} /> 건너뛰기
              </button>
            )}
            {isReviewing ? (
              <Badge variant="surface">복습 중</Badge>
            ) : (
              <Badge variant={phase === 'complete' ? 'success' : 'primary'}>
                {PHASE_LABELS[phase] || phase}
              </Badge>
            )}
            <button
              onClick={() => setShowStatsSidebar(true)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-container-high transition-colors"
              aria-label="통계 패널 열기"
            >
              <PanelRightOpen size={20} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <ChatMessageList
          ref={chatEndRef}
          messages={messages}
          loading={loading}
          error={error}
          phase={phase}
          sessionId={sessionId}
          currentSeg={currentSeg}
          isReviewing={isReviewing}
          totalSegments={session?.segments?.length || 0}
          onRetry={() => loadSession(sessionId!)}
          phaseLabels={PHASE_LABELS}
        />

        {/* Input Area */}
        <ChatInput
          phase={phase}
          loading={loading}
          isReviewing={isReviewing}
          isInputActive={isInputActive}
          input={input}
          discussCountdown={discussCountdown}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          onAdvance={advanceSegment}
          onFinishChallenge={finishChallenge}
        />
      </section>

      {/* Stats Sidebar */}
      <StatsSidebar
        show={showStatsSidebar}
        onClose={() => setShowStatsSidebar(false)}
        session={session}
        currentState={currentState}
        currentSeg={currentSeg}
        constellation={constellation}
      />
    </div>
  );
}
