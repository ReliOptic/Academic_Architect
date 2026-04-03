import React, { forwardRef } from 'react';
import { Sparkles, Loader2, Archive, FileDown, AlertTriangle, WifiOff, ArrowLeft } from 'lucide-react';
import type { Phase, SegmentInfo } from '../../types';
import type { ChatMessage } from '../../hooks/useSession';

const ERROR_PHASE_LABELS: Partial<Record<Phase, string>> = {
  idle: '세션 로딩',
  preview: '예측 제출',
  probing: 'Probe 질문 생성',
  hinting: '힌트 생성',
  analyzing: '분석',
  delivering: '전달',
  discussing: '자유 질문 처리',
  challenge_prompt: '통합 도전 생성',
  challenge_feedback: '도전 완료 처리',
};

interface ChatMessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  errorPhase: Phase | null;
  errorIsNetwork: boolean;
  errorCount: number;
  phase: Phase;
  sessionId: string;
  currentSeg: SegmentInfo | null | undefined;
  isReviewing: boolean;
  totalSegments: number;
  onRetry: () => void;
  onRetryPhase?: Partial<Record<string, () => void>>;
  onNavigateDashboard?: () => void;
  onNavigateArchive?: () => void;
  onExportMarkdown?: () => void;
  phaseLabels: Partial<Record<Phase, string>>;
}

const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  function ChatMessageList(
    { messages, loading, error, errorPhase, errorIsNetwork, errorCount, phase, currentSeg, isReviewing, totalSegments, onRetry, onRetryPhase, onNavigateDashboard, onNavigateArchive, onExportMarkdown, phaseLabels },
    ref,
  ) {
    const handleRetry = () => {
      if (errorPhase && onRetryPhase?.[errorPhase]) {
        onRetryPhase[errorPhase]!();
      } else {
        onRetry();
      }
    };

    return (
      <div className="flex-1 overflow-y-auto p-8 space-y-6" aria-live="polite" aria-relevant="additions">
        {/* Preview prompt */}
        {!isReviewing && phase === 'preview' && messages.length === 0 && currentSeg && (
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
              {Boolean(msg.metadata?.cross_segment_link) && (
                <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-primary/10 rounded-lg text-xs font-bold text-primary">
                  <Sparkles size={14} /> 세그먼트 간 연결 발견!
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className={`text-[9px] mt-2 ${
                msg.role === 'user' ? 'text-white/50' : 'text-on-surface-variant/40'
              }`}>
                {phaseLabels[msg.phase] || msg.phase}
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
            <div className="text-center space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-primary/20">
              <h3 className="font-bold text-lg text-primary">탐구 완료!</h3>
              <p className="text-sm text-on-surface-variant">
                총 {totalSegments}개 파트를 탐구했습니다.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {onNavigateArchive && (
                  <button
                    onClick={onNavigateArchive}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    <Archive size={14} /> 아카이브에서 확인
                  </button>
                )}
                {onExportMarkdown && (
                  <button
                    onClick={onExportMarkdown}
                    className="flex items-center gap-2 px-4 py-2.5 ghost-border rounded-xl text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <FileDown size={14} /> MD 내보내기
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center">
            <div className="max-w-md w-full p-5 bg-error/10 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                {errorIsNetwork ? (
                  <WifiOff size={18} className="text-error mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-error mt-0.5 shrink-0" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="font-bold text-sm text-error">
                    {errorPhase
                      ? `${ERROR_PHASE_LABELS[errorPhase] || errorPhase} 중 오류`
                      : '오류가 발생했습니다'}
                  </div>
                  <p className="text-xs text-error/80">{error}</p>
                </div>
              </div>

              {errorIsNetwork ? (
                <p className="text-xs text-on-surface-variant">
                  네트워크 연결을 확인하세요. 서버가 실행 중인지, 인터넷 연결이 정상인지 확인한 후 재시도하세요.
                </p>
              ) : (
                <p className="text-xs text-on-surface-variant">
                  백엔드에서 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                {errorCount < 3 ? (
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-error/20 text-error rounded-xl text-xs font-bold hover:bg-error/30 transition-colors"
                  >
                    재시도
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 bg-error/20 text-error rounded-xl text-xs font-bold hover:bg-error/30 transition-colors"
                    >
                      재시도
                    </button>
                    {onNavigateDashboard && (
                      <button
                        onClick={onNavigateDashboard}
                        className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-xl text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <ArrowLeft size={12} /> 대시보드로 복귀
                      </button>
                    )}
                  </>
                )}
              </div>

              {errorCount >= 3 && (
                <p className="text-[10px] text-error/60">
                  연속 {errorCount}회 실패 — 대시보드로 돌아가 환경을 확인하는 것을 권장합니다.
                </p>
              )}
            </div>
          </div>
        )}

        <div ref={ref} />
      </div>
    );
  },
);

export default ChatMessageList;
