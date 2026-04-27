/**
 * API service layer — FastAPI 백엔드 통신.
 * Vite proxy가 /api → localhost:8000 으로 전달.
 */

import type {
  AnswerResponse,
  ConstellationData,
  DiscussResponse,
  ProbeResponse,
  Session,
  SessionListItem,
  BackendStatus,
} from './types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

// ── Sessions ──

export async function createSession(file: File): Promise<{
  session_id: string;
  title: string;
  segment_count: number;
  segments: { id: number; title: string; core_concept: string }[];
}> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/sessions`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export function listSessions() {
  return request<SessionListItem[]>('/sessions');
}

export function getSession(id: string) {
  return request<Session>(`/sessions/${id}`);
}

export function deleteSession(id: string) {
  return request<{ ok: boolean }>(`/sessions/${id}`, { method: 'DELETE' });
}

// ── Preview ──

export function savePreview(sessionId: string, prediction: string) {
  return request<{ ok: boolean; phase: string }>(`/sessions/${sessionId}/preview`, {
    method: 'POST',
    body: JSON.stringify({ prediction }),
  });
}

export function skipPreview(sessionId: string) {
  return request<{ ok: boolean; phase: string }>(`/sessions/${sessionId}/skip-preview`, {
    method: 'POST',
  });
}

// ── Probe ──

export function getProbe(sessionId: string) {
  return request<ProbeResponse>(`/sessions/${sessionId}/probe`);
}

// ── Answer ──

export function submitAnswer(sessionId: string, content: string) {
  return request<AnswerResponse>(`/sessions/${sessionId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ── Discuss ──

export function discuss(sessionId: string, content: string) {
  return request<DiscussResponse>(`/sessions/${sessionId}/discuss`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ── Challenge ──

export function getChallenge(sessionId: string) {
  return request<{ question: string }>(`/sessions/${sessionId}/challenge`);
}

export function submitChallenge(sessionId: string, content: string) {
  return request<{ feedback: string; phase: string }>(`/sessions/${sessionId}/challenge`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function skipChallenge(sessionId: string) {
  return request<{ ok: boolean; phase: string }>(`/sessions/${sessionId}/skip-challenge`, {
    method: 'POST',
  });
}

// ── Constellation ──

export function getConstellation(sessionId: string) {
  return request<ConstellationData>(`/sessions/${sessionId}/constellation`);
}

// ── Archive export ──

export async function exportSessionMarkdown(sessionId: string): Promise<{
  filename: string;
  blob: Blob;
}> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/export/markdown`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Export failed ${res.status}: ${body}`);
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match ? match[1] : `session-${sessionId}.md`;
  const blob = await res.blob();
  return { filename, blob };
}

// ── Health ──

export function healthCheck() {
  return request<{ status: string; backend: string }>('/health');
}

export function getBackendStatus() {
  return request<BackendStatus>('/status');
}
