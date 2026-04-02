/**
 * 세션 상태 관리 hook — useReducer 기반.
 * stale closure 방지를 위해 session ID를 useRef로 추적.
 */

import { useReducer, useCallback, useRef } from 'react';
import * as api from '../api';
import type {
  AnswerResponse,
  ConstellationData,
  DiscussResponse,
  Phase,
  SegmentState,
  Session,
} from '../types';

// ── Types ──

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  phase: Phase;
  metadata?: Record<string, unknown>;
}

interface SessionState {
  session: Session | null;
  messages: ChatMessage[];
  phase: Phase;
  loading: boolean;
  error: string | null;
  constellation: ConstellationData | null;
  viewingSegmentIndex: number | null;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SESSION'; session: Session; messages: ChatMessage[] }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'UPDATE_SESSION'; session: Session; segmentChanged: boolean }
  | { type: 'SET_CONSTELLATION'; data: ConstellationData }
  | { type: 'LOADING_DONE' }
  | { type: 'VIEW_SEGMENT'; index: number; messages: ChatMessage[] }
  | { type: 'RETURN_TO_CURRENT'; messages: ChatMessage[] };

// ── Reducer ──

const initialState: SessionState = {
  session: null,
  messages: [],
  phase: 'idle',
  loading: false,
  error: null,
  constellation: null,
  viewingSegmentIndex: null,
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_SESSION':
      return {
        ...state,
        session: action.session,
        phase: action.session.phase,
        messages: action.messages,
        loading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'UPDATE_SESSION': {
      const next: SessionState = {
        ...state,
        session: action.session,
        phase: action.session.phase,
      };
      if (action.segmentChanged) {
        next.messages = hydrateMessages(action.session);
      }
      return next;
    }
    case 'SET_CONSTELLATION':
      return { ...state, constellation: action.data };
    case 'LOADING_DONE':
      return { ...state, loading: false };
    case 'VIEW_SEGMENT':
      return { ...state, viewingSegmentIndex: action.index, messages: action.messages };
    case 'RETURN_TO_CURRENT':
      return { ...state, viewingSegmentIndex: null, messages: action.messages };
    default:
      return state;
  }
}

// ── Helpers ──

function makeId(): string {
  return `msg-${crypto.randomUUID().slice(0, 8)}`;
}

function hydrateMessages(session: Session): ChatMessage[] {
  const state = session.segment_states?.[session.current_segment_index];
  return hydrateSegmentMessages(state);
}

function hydrateSegmentMessages(state: SegmentState | undefined): ChatMessage[] {
  if (!state?.messages?.length) return [];
  return state.messages.map((m) => ({
    id: m.id || makeId(),
    role: m.role,
    content: m.content,
    phase: m.phase,
    metadata: m.metadata,
  }));
}

// ── Hook ──

export interface UseSessionReturn {
  session: Session | null;
  messages: ChatMessage[];
  phase: Phase;
  loading: boolean;
  error: string | null;
  constellation: ConstellationData | null;
  viewingSegmentIndex: number | null;

  loadSession: (id: string) => Promise<void>;
  submitPreview: (prediction: string) => Promise<void>;
  skipPreviewPhase: () => Promise<void>;
  startProbe: () => Promise<void>;
  sendAnswer: (content: string) => Promise<AnswerResponse>;
  sendDiscuss: (content: string) => Promise<DiscussResponse>;
  advanceSegment: () => Promise<void>;
  startChallenge: () => Promise<void>;
  sendChallenge: (content: string) => Promise<void>;
  finishChallenge: () => Promise<void>;
  skipChallengePhase: () => Promise<void>;
  refreshConstellation: () => Promise<void>;
  viewSegment: (index: number) => void;
  returnToCurrentSegment: () => void;
}

export function useSession(): UseSessionReturn {
  const [state, dispatch] = useReducer(reducer, initialState);
  const sessionIdRef = useRef<string | null>(null);

  // session ID를 ref로 추적하여 stale closure 방지
  if (state.session) {
    sessionIdRef.current = state.session.id;
  }

  const getSessionId = (): string => {
    const id = sessionIdRef.current;
    if (!id) throw new Error('No active session');
    return id;
  };

  const addMsg = useCallback((role: ChatMessage['role'], content: string, phase: Phase, metadata?: Record<string, unknown>) => {
    dispatch({ type: 'ADD_MESSAGE', message: { id: makeId(), role, content, phase, metadata } });
  }, []);

  const refreshSession = useCallback(async (prevSegIdx?: number) => {
    const id = sessionIdRef.current;
    if (!id) return;
    const s = await api.getSession(id);
    const segmentChanged = prevSegIdx !== undefined
      ? s.current_segment_index !== prevSegIdx
      : false;
    dispatch({ type: 'UPDATE_SESSION', session: s, segmentChanged });
  }, []);

  const refreshConstellation = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;
    try {
      const data = await api.getConstellation(id);
      dispatch({ type: 'SET_CONSTELLATION', data });
    } catch {
      // constellation 실패는 무시
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    dispatch({ type: 'LOAD_START' });
    try {
      sessionIdRef.current = id;
      const s = await api.getSession(id);
      dispatch({ type: 'LOAD_SESSION', session: s, messages: hydrateMessages(s) });
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const submitPreview = useCallback(async (prediction: string) => {
    dispatch({ type: 'LOAD_START' });
    try {
      const id = getSessionId();
      const segId = state.session?.segments[state.session.current_segment_index]?.id ?? 0;
      addMsg('user', prediction, 'preview');
      await api.savePreview(id, prediction);
      api.logEvent(id, 'preview_submitted', segId).catch(() => {});
      dispatch({ type: 'SET_PHASE', phase: 'probing' });
      await refreshSession();
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [addMsg, refreshSession, state.session]);

  const skipPreviewPhase = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const id = getSessionId();
      const segId = state.session?.segments[state.session.current_segment_index]?.id ?? 0;
      await api.skipPreview(id);
      api.logEvent(id, 'preview_skipped', segId).catch(() => {});
      dispatch({ type: 'SET_PHASE', phase: 'probing' });
      await refreshSession();
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [refreshSession, state.session]);

  const startProbe = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const probe = await api.getProbe(getSessionId());
      addMsg('assistant', probe.question, 'probing');
      dispatch({ type: 'SET_PHASE', phase: 'probing' });
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [addMsg]);

  const sendAnswer = useCallback(async (content: string): Promise<AnswerResponse> => {
    dispatch({ type: 'LOAD_START' });
    try {
      const id = getSessionId();
      addMsg('user', content, 'probing');
      const result = await api.submitAnswer(id, content);

      if (result.needs_reanswer && result.hint) {
        addMsg('assistant', result.hint, 'hinting');
        dispatch({ type: 'SET_PHASE', phase: 'hinting' });
      } else if (result.delivery) {
        addMsg('assistant', result.delivery, 'delivering');
        dispatch({ type: 'SET_PHASE', phase: 'discussing' });
      }

      const prevIdx = state.session?.current_segment_index;
      await refreshSession(prevIdx);
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch({ type: 'SET_ERROR', error: msg });
      throw e;
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [addMsg, refreshSession, state.session?.current_segment_index]);

  const sendDiscuss = useCallback(async (content: string): Promise<DiscussResponse> => {
    dispatch({ type: 'LOAD_START' });
    try {
      const id = getSessionId();
      addMsg('user', content, 'discussing');
      const result = await api.discuss(id, content);

      addMsg('assistant', result.reply, 'discussing', {
        cross_segment_link: result.cross_segment_link,
      });

      if (result.end_segment) {
        const prevIdx = state.session?.current_segment_index;
        await refreshSession(prevIdx);
        await refreshConstellation();
      }

      dispatch({ type: 'SET_PHASE', phase: result.phase as Phase });
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch({ type: 'SET_ERROR', error: msg });
      throw e;
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [addMsg, refreshSession, refreshConstellation, state.session?.current_segment_index]);

  const advanceSegment = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const id = getSessionId();
      const prevIdx = state.session?.current_segment_index;
      await api.nextSegment(id);
      await refreshSession(prevIdx);
      await refreshConstellation();
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [refreshSession, refreshConstellation, state.session?.current_segment_index]);

  const startChallenge = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const { question } = await api.getChallenge(getSessionId());
      addMsg('assistant', question, 'challenge_prompt');
      dispatch({ type: 'SET_PHASE', phase: 'challenge_prompt' });
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [addMsg]);

  const sendChallenge = useCallback(async (content: string) => {
    dispatch({ type: 'LOAD_START' });
    try {
      const id = getSessionId();
      addMsg('user', content, 'challenge_prompt');
      const result = await api.submitChallenge(id, content);
      addMsg('assistant', result.feedback, 'challenge_feedback');
      dispatch({ type: 'SET_PHASE', phase: result.phase as Phase });
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [addMsg]);

  const finishChallenge = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const id = getSessionId();
      const prevIdx = state.session?.current_segment_index;
      await api.finishChallenge(id);
      await refreshSession(prevIdx);
      await refreshConstellation();
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [refreshSession, refreshConstellation, state.session?.current_segment_index]);

  const skipChallengePhase = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const id = getSessionId();
      const prevIdx = state.session?.current_segment_index;
      await api.skipChallenge(id);
      await refreshSession(prevIdx);
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', error: e instanceof Error ? e.message : String(e) });
    } finally {
      dispatch({ type: 'LOADING_DONE' });
    }
  }, [refreshSession, state.session?.current_segment_index]);

  const viewSegment = useCallback((index: number) => {
    const s = state.session;
    if (!s) return;
    const st = s.segment_states[index];
    if (!st?.completed) return;
    const msgs = hydrateSegmentMessages(st);
    dispatch({ type: 'VIEW_SEGMENT', index, messages: msgs });
  }, [state.session]);

  const returnToCurrentSegment = useCallback(() => {
    const s = state.session;
    if (!s) return;
    const msgs = hydrateMessages(s);
    dispatch({ type: 'RETURN_TO_CURRENT', messages: msgs });
  }, [state.session]);

  return {
    session: state.session,
    messages: state.messages,
    phase: state.phase,
    loading: state.loading,
    error: state.error,
    constellation: state.constellation,
    viewingSegmentIndex: state.viewingSegmentIndex,
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
    refreshConstellation,
    viewSegment,
    returnToCurrentSegment,
  };
}
