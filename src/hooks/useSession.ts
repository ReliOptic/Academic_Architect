/**
 * 세션 상태 관리 hook.
 * 학습 루프의 모든 phase를 관리한다.
 */

import { useState, useCallback } from 'react';
import * as api from '../api';
import type {
  AnswerResponse,
  ConstellationData,
  DiscussResponse,
  Phase,
  ProbeResponse,
  Session,
} from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  phase: Phase;
  metadata?: Record<string, unknown>;
}

interface UseSessionReturn {
  session: Session | null;
  messages: ChatMessage[];
  phase: Phase;
  loading: boolean;
  error: string | null;

  // Actions
  loadSession: (id: string) => Promise<void>;
  submitPreview: (prediction: string) => Promise<void>;
  skipPreviewPhase: () => Promise<void>;
  startProbe: () => Promise<void>;
  sendAnswer: (content: string) => Promise<AnswerResponse>;
  sendDiscuss: (content: string) => Promise<DiscussResponse>;
  startChallenge: () => Promise<void>;
  sendChallenge: (content: string) => Promise<void>;
  skipChallengePhase: () => Promise<void>;
  constellation: ConstellationData | null;
  refreshConstellation: () => Promise<void>;
}

let msgCounter = 0;
function makeId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

function hydrateMessages(session: Session): ChatMessage[] {
  const state = session.segment_states?.[session.current_segment_index];
  if (!state?.messages?.length) return [];
  return state.messages.map((message) => ({
    id: message.id || makeId(),
    role: message.role,
    content: message.content,
    phase: message.phase,
    metadata: message.metadata,
  }));
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [constellation, setConstellation] = useState<ConstellationData | null>(null);

  const addMessage = useCallback((role: ChatMessage['role'], content: string, msgPhase: Phase, metadata?: Record<string, unknown>) => {
    setMessages(prev => [...prev, { id: makeId(), role, content, phase: msgPhase, metadata }]);
  }, []);

  const loadSession = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const s = await api.getSession(id);
      setSession(s);
      setPhase(s.phase);
      setMessages(hydrateMessages(s));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session) return;
    const s = await api.getSession(session.id);
    setSession(s);
    setPhase(s.phase);
    setMessages(hydrateMessages(s));
  }, [session]);

  const submitPreview = useCallback(async (prediction: string) => {
    if (!session) return;
    setLoading(true);
    try {
      addMessage('user', prediction, 'preview');
      await api.savePreview(session.id, prediction);
      setPhase('probing');
      await refreshSession();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session, addMessage, refreshSession]);

  const skipPreviewPhase = useCallback(async () => {
    if (!session) return;
    await api.skipPreview(session.id);
    setPhase('probing');
    await refreshSession();
  }, [session, refreshSession]);

  const startProbe = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const probe = await api.getProbe(session.id);
      addMessage('assistant', probe.question, 'probing');
      setPhase('probing');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session, addMessage]);

  const sendAnswer = useCallback(async (content: string): Promise<AnswerResponse> => {
    if (!session) throw new Error('No session');
    setLoading(true);
    try {
      addMessage('user', content, 'probing');
      const result = await api.submitAnswer(session.id, content);

      if (result.needs_reanswer && result.hint) {
        addMessage('assistant', result.hint, 'hinting');
        setPhase('hinting');
      } else if (result.delivery) {
        addMessage('assistant', result.delivery, 'delivering');
        setPhase('discussing');
      }

      await refreshSession();
      return result;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [session, addMessage, refreshSession]);

  const sendDiscuss = useCallback(async (content: string): Promise<DiscussResponse> => {
    if (!session) throw new Error('No session');
    setLoading(true);
    try {
      addMessage('user', content, 'discussing');
      const result = await api.discuss(session.id, content);

      addMessage('assistant', result.reply, 'discussing', {
        cross_segment_link: result.cross_segment_link,
      });

      if (result.end_segment) {
        await refreshSession();
        await refreshConstellation();
      }

      setPhase(result.phase as Phase);
      return result;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [session, addMessage, refreshSession]);

  const startChallenge = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { question } = await api.getChallenge(session.id);
      addMessage('assistant', question, 'challenge_prompt');
      setPhase('challenge_prompt');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session, addMessage]);

  const sendChallenge = useCallback(async (content: string) => {
    if (!session) return;
    setLoading(true);
    try {
      addMessage('user', content, 'challenge_prompt');
      const result = await api.submitChallenge(session.id, content);
      addMessage('assistant', result.feedback, 'challenge_feedback');
      setPhase(result.phase as Phase);
      await refreshSession();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session, addMessage, refreshSession]);

  const skipChallengePhase = useCallback(async () => {
    if (!session) return;
    await api.skipChallenge(session.id);
    await refreshSession();
  }, [session, refreshSession]);

  const refreshConstellation = useCallback(async () => {
    if (!session) return;
    try {
      const data = await api.getConstellation(session.id);
      setConstellation(data);
    } catch {
      // silent fail
    }
  }, [session]);

  return {
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
  };
}
