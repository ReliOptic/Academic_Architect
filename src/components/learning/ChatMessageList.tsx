import React, { forwardRef } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Phase, SegmentInfo } from '../../types';
import type { ChatMessage } from '../../hooks/useSession';

interface ChatMessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  phase: Phase;
  sessionId: string;
  currentSeg: SegmentInfo | null | undefined;
  isReviewing: boolean;
  totalSegments: number;
  onRetry: () => void;
  phaseLabels: Partial<Record<Phase, string>>;
}

const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  function ChatMessageList(
    { messages, loading, error, phase, currentSeg, isReviewing, totalSegments, onRetry, phaseLabels },
    ref,
  ) {
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
            <div className="text-center space-y-3 p-6 bg-surface-container-lowest rounded-2xl border border-primary/20">
              <h3 className="font-bold text-lg text-primary">탐구 완료!</h3>
              <p className="text-sm text-on-surface-variant">
                총 {totalSegments}개 파트를 탐구했습니다.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center">
            <div className="p-4 bg-error/10 text-error rounded-xl text-sm flex items-center gap-3">
              <span>{error}</span>
              <button
                onClick={onRetry}
                className="shrink-0 px-3 py-1 bg-error/20 rounded-lg text-xs font-bold hover:bg-error/30 transition-colors"
              >
                재시도
              </button>
            </div>
          </div>
        )}

        <div ref={ref} />
      </div>
    );
  },
);

export default ChatMessageList;
