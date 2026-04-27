import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ArrowUp,
  BarChart3,
  Map,
  Save,
  SkipForward,
  Loader2,
  Sparkles,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { SectionHeader } from './ui/SectionHeader';
import { useSession } from '../hooks/useSession';
import ConstellationView from './ConstellationView';
import type { Phase } from '../types';

interface Props {
  sessionId: string | null;
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

export default function LearningScreen({ sessionId }: Props) {
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
    startChallenge,
    sendChallenge,
    skipChallengePhase,
    constellation,
    refreshConstellation,
  } = useSession();

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load session + constellation
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId).then(() => refreshConstellation());
    }
  }, [sessionId, loadSession, refreshConstellation]);

  // Auto-start probe when entering probing phase with no probe question yet
  useEffect(() => {
    if (phase === 'probing' && session && !loading) {
      const hasProbeMsg = messages.some(m => m.phase === 'probing' && m.role === 'assistant');
      if (!hasProbeMsg) {
        startProbe();
      }
    }
  }, [phase, session]);

  // Auto-start challenge
  useEffect(() => {
    if (phase === 'challenge_prompt' && session && !loading) {
      const hasChallenge = messages.some(m => m.phase === 'challenge_prompt' && m.role === 'assistant');
      if (!hasChallenge) {
        startChallenge();
      }
    }
  }, [phase, session]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const currentSeg = session?.segments?.[session.current_segment_index];
  const currentState = session?.segment_states?.[session.current_segment_index];
  const isInputActive = ['preview', 'probing', 'hinting', 'discussing', 'challenge_prompt'].includes(phase);

  const placeholderMap: Partial<Record<Phase, string>> = {
    preview: '이 파트에서 뭘 다룰 것 같아?',
    probing: '답변을 입력하세요...',
    hinting: '작은 질문에 답해봐...',
    discussing: '후속 질문에 답하거나, 더 파고 싶은 거 있어? 아니면 "다음"',
    challenge_prompt: '통합 질문에 답변해봐...',
  };

  if (!sessionId) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center space-y-4">
          <Activity size={48} className="mx-auto text-primary/40" />
          <h3 className="headline-sm">세션을 선택하세요</h3>
          <p className="text-sm text-on-surface-variant opacity-60">
            Dashboard에서 스크립트를 업로드하면 학습이 시작됩니다.
          </p>
        </div>
      </div>
    );
  }

  // Deep-link to a session that no longer exists / failed to load.
  if (sessionId && !loading && !session && error) {
    const cleanUrlAndGoDashboard = () => {
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      window.location.reload();
    };
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="max-w-md text-center space-y-5 p-8 bg-surface-container-lowest rounded-2xl border border-error/30">
          <AlertTriangle size={36} className="mx-auto text-error/70" />
          <div className="space-y-2">
            <h3 className="headline-sm">이 세션을 찾을 수 없습니다</h3>
            <p className="text-xs text-on-surface-variant whitespace-pre-wrap">
              {error}
            </p>
            <p className="text-xs text-on-surface-variant opacity-60">
              세션 ID <code className="font-mono">{sessionId}</code> 가 삭제되었거나, 백엔드가 다른 데이터 디렉토리를 보고 있을 수 있어요.
            </p>
          </div>
          <button
            onClick={cleanUrlAndGoDashboard}
            className="px-5 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Dashboard로 돌아가기
          </button>
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
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar — Segment List */}
      <aside className="w-64 bg-surface-container-low border-r border-outline-variant/5 flex flex-col py-8">
        <div className="px-6 mb-10">
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
            return (
              <div
                key={seg.id}
                className={`px-6 py-3 text-sm transition-all ${
                  isCurrent
                    ? 'bg-surface-container-lowest text-primary border-r-4 border-primary'
                    : st?.completed
                    ? 'text-on-surface-variant/80'
                    : 'text-on-surface-variant/40'
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
              </div>
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
        <header className="h-20 px-10 flex items-center justify-between bg-surface-container-lowest/50 backdrop-blur-md border-b border-outline-variant/5">
          <div>
            <div className="label-md text-[9px] text-on-surface-variant uppercase tracking-widest">
              {currentSeg ? `파트 ${currentSeg.id}` : '대기 중'}
            </div>
            <h1 className="headline-md">
              {currentSeg?.title || '세션 로딩 중...'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {phase === 'preview' && (
              <button
                onClick={skipPreviewPhase}
                className="ghost-border px-4 py-2 rounded-full label-md text-[10px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
              >
                <SkipForward size={12} /> 건너뛰기
              </button>
            )}
            {phase === 'challenge_prompt' && (
              <button
                onClick={skipChallengePhase}
                className="ghost-border px-4 py-2 rounded-full label-md text-[10px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
              >
                <SkipForward size={12} /> 건너뛰기
              </button>
            )}
            <Badge variant={phase === 'complete' ? 'success' : 'primary'}>
              {PHASE_LABELS[phase] || phase}
            </Badge>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Preview prompt */}
          {phase === 'preview' && messages.length === 0 && currentSeg && (
            <div className="flex justify-center">
              <div className="max-w-md text-center space-y-3 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                <Sparkles size={24} className="mx-auto text-primary/60" />
                <h3 className="font-bold text-lg">다음 파트: {currentSeg.title}</h3>
                <p className="text-sm text-on-surface-variant">
                  이 파트에서 뭘 다룰 것 같아? 예측해봐!
                </p>
                <p className="text-[10px] text-on-surface-variant/50">
                  또는 오른쪽 위 "건너뛰기" 버튼으로 바로 시작
                </p>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-surface-container-lowest border border-outline-variant/10 rounded-bl-md'
                }`}
              >
                {msg.metadata?.cross_segment_link && (
                  <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-tertiary">
                    <Sparkles size={10} /> 세그먼트 간 연결 발견!
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className={`text-[9px] mt-2 ${
                  msg.role === 'user' ? 'text-white/50' : 'text-on-surface-variant/40'
                }`}>
                  {PHASE_LABELS[msg.phase] || msg.phase}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl rounded-bl-md px-5 py-3">
                <Loader2 size={16} className="animate-spin text-primary" />
              </div>
            </div>
          )}

          {/* Session complete */}
          {phase === 'complete' && (
            <div className="flex justify-center">
              <div className="text-center space-y-3 p-6 bg-surface-container-lowest rounded-2xl border border-primary/20">
                <h3 className="font-bold text-lg text-primary">탐구 완료!</h3>
                <p className="text-sm text-on-surface-variant">
                  총 {session?.segments?.length}개 파트를 탐구했습니다.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex justify-center">
              <div className="p-4 bg-error/10 text-error rounded-xl text-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8">
          <div className={`max-w-3xl mx-auto relative ${!isInputActive ? 'opacity-40 pointer-events-none' : ''}`}>
            <textarea
              ref={textareaRef}
              className="w-full bg-surface-container-lowest ghost-border rounded-full px-8 py-4 pr-16 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder={placeholderMap[phase] || '...'}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isInputActive || loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Sidebar */}
      <aside className="w-96 bg-surface border-l border-outline-variant/5 p-8 space-y-10 overflow-y-auto">
        {/* Depth Gauge */}
        <div className="space-y-4">
          <SectionHeader icon={BarChart3} label="탐구 깊이" />
          <Card variant="low" hover={false} className="p-6 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <div className={`font-manrope text-4xl font-extrabold ${
                  currentState?.completed
                    ? DEPTH_LABELS[currentState.depth_label]?.color || ''
                    : 'text-on-surface-variant'
                }`}>
                  {currentState?.depth_label || '대기'}
                </div>
                <div className="text-xs font-medium text-on-surface-variant">
                  {currentSeg?.core_concept || ''}
                </div>
              </div>
              <Badge variant={currentState?.completed ? 'success' : 'surface'}>
                {currentState?.completed ? '완료' : '진행중'}
              </Badge>
            </div>
            {/* Level trend bars */}
            <div className="flex gap-1.5 h-2">
              {session?.segment_states.map((st, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all ${
                    st.completed
                      ? st.level >= 4 ? 'bg-status-active' :
                        st.level >= 3 ? 'bg-primary' :
                        st.level >= 2 ? 'bg-tertiary' :
                        'bg-on-surface-variant/30'
                      : 'bg-surface-container-high'
                  }`}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Preview vs Actual */}
        {currentState?.preview_prediction && currentState?.completed && (
          <div className="space-y-4">
            <SectionHeader icon={MessageCircle} label="예측 vs 실제" />
            <Card variant="lowest" hover={false} className="p-4 space-y-3">
              <div>
                <div className="text-[9px] font-bold text-on-surface-variant uppercase mb-1">내 예측</div>
                <p className="text-xs text-on-surface-variant/70">{currentState.preview_prediction}</p>
              </div>
              <div>
                <div className="text-[9px] font-bold text-primary uppercase mb-1">실제 내용</div>
                <p className="text-xs">{currentSeg?.core_concept}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Knowledge Constellation (§G-2) */}
        <div className="space-y-4">
          <SectionHeader icon={Map} label="지식 별자리" />
          <div className="h-64 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-2">
            <ConstellationView
              data={constellation || { nodes: [], edges: [] }}
              currentSegmentId={currentSeg?.id}
            />
          </div>
        </div>

        <button className="w-full py-4 bg-surface-container-high rounded-xl label-md text-[10px] text-on-surface-variant flex items-center justify-center gap-2 opacity-40 cursor-not-allowed">
          <Save size={14} /> 세션 아카이브
        </button>
      </aside>
    </div>
  );
}
