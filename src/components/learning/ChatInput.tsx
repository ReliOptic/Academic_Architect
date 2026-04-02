import React, { useEffect, useRef } from 'react';
import { ArrowUp, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Phase } from '../../types';

const PLACEHOLDER_MAP: Partial<Record<Phase, string>> = {
  preview: '이 파트에서 뭘 다룰 것 같아?',
  probing: '답변을 입력하세요...',
  hinting: '다시 생각해서 답변해봐...',
  discussing: '궁금한 거 있어? 없으면 "다음"',
  challenge_prompt: '통합 질문에 답변해봐...',
};

interface ChatInputProps {
  phase: Phase;
  loading: boolean;
  isReviewing: boolean;
  isInputActive: boolean;
  input: string;
  discussCountdown: number | null;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onAdvance: () => void;
  onFinishChallenge: () => void;
}

export default function ChatInput({
  phase,
  loading,
  isReviewing,
  isInputActive,
  input,
  discussCountdown,
  onInputChange,
  onKeyDown,
  onSend,
  onAdvance,
  onFinishChallenge,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  return (
    <div className="p-8">
      {/* "다음 파트" 버튼 — Discuss / Challenge Feedback 단계 */}
      {!isReviewing && phase === 'discussing' && !loading && (
        <div className="max-w-3xl mx-auto mb-3 space-y-2">
          {discussCountdown !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-tertiary/10 text-tertiary rounded-xl text-sm font-medium animate-pulse">
              <AlertTriangle size={14} />
              {discussCountdown}초 후 다음 파트로 넘어갑니다
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={onAdvance}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
              다음 파트로 <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      {!isReviewing && phase === 'challenge_feedback' && !loading && (
        <div className="max-w-3xl mx-auto mb-3 flex justify-end">
          <button
            onClick={onFinishChallenge}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            다음 파트로 <ChevronRight size={16} />
          </button>
        </div>
      )}
      <div className={`max-w-3xl mx-auto relative ${!isInputActive ? 'opacity-40 pointer-events-none' : ''}`}>
        <textarea
          ref={textareaRef}
          className="w-full bg-surface-container-lowest ghost-border rounded-2xl px-8 py-4 pr-16 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none overflow-hidden"
          placeholder={PLACEHOLDER_MAP[phase] || '...'}
          rows={1}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          disabled={!isInputActive || loading}
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || loading}
          aria-label="메시지 전송"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </div>
  );
}
