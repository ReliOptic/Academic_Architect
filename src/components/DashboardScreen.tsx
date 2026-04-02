import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Upload,
  Loader2,
  Trash2,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ServerCog,
  Bot,
  RefreshCw,
  PanelRightOpen,
  PanelRightClose,
  ArrowRight,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { SectionHeader } from './ui/SectionHeader';
import * as api from '../api';
import type { BackendStatus, DepthLabel, SessionListItem } from '../types';

interface Props {
  onSessionStart: (sessionId: string) => void;
}

export default function DashboardScreen({ onSessionStart }: Props) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const list = await api.listSessions();
      setSessions(list);
    } catch {
      // Backend may not be running yet
    }
  }, []);

  const loadBackendStatus = useCallback(async () => {
    try {
      const status = await api.getBackendStatus();
      setBackendStatus(status);
    } catch {
      setBackendStatus(null);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadBackendStatus();
  }, [loadSessions, loadBackendStatus]);

  // Pending 세션이 있으면 5초마다 세션 목록 자동 갱신
  useEffect(() => {
    const hasPending = sessions.some((s) => s.setup_state === 'pending');
    if (!hasPending) return;
    const timer = setInterval(loadSessions, 5000);
    return () => clearInterval(timer);
  }, [sessions, loadSessions]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await api.createSession(file);
      onSessionStart(result.session_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('이 세션을 삭제하시겠습니까? 학습 기록이 영구적으로 삭제됩니다.')) return;
    try {
      await api.deleteSession(id);
      loadSessions();
    } catch {
      setError('세션 삭제에 실패했습니다.');
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const readyCount = sessions.filter((s) => s.setup_state === 'ready').length;
  const pendingCount = sessions.filter((s) => s.setup_state === 'pending').length;
  const errorCount = sessions.filter((s) => s.setup_state === 'error').length;

  // §G-6: 4단계 깊이 바 색상 매핑 (Bloom 숫자 노출 금지)
  const DEPTH_BAR: Record<DepthLabel, { color: string; width: string; label: string }> = {
    '표면 탐색': { color: 'bg-outline-variant/50', width: 'w-1/4', label: '표면 탐색' },
    '구조 파악': { color: 'bg-primary/40', width: 'w-2/4', label: '구조 파악' },
    '핵심 도달': { color: 'bg-primary/70', width: 'w-3/4', label: '핵심 도달' },
    '심층 연결': { color: 'bg-primary', width: 'w-full', label: '심층 연결' },
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 md:px-12 py-12">
          {/* Header */}
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="headline-lg">학습 대시보드</h1>
              <p className="text-on-surface-variant text-sm max-w-xl leading-relaxed opacity-70">
                자료를 업로드하여 탐구를 시작하세요. 세션을 클릭하면 학습 화면으로 이동합니다.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Compact status indicator */}
              <button
                onClick={() => setPanelOpen(!panelOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${backendStatus?.llm_ready ? 'bg-status-active' : 'bg-error'}`} />
                {backendStatus?.llm_ready ? '정상' : '점검 필요'}
                {panelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              </button>
              <button
                onClick={() => {
                  loadSessions();
                  loadBackendStatus();
                }}
                className="ghost-border p-2 rounded-xl text-on-surface-variant hover:text-primary transition-all"
                aria-label="새로고침"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </header>

          {/* Upload Area — compact */}
          <section className="mb-10">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.srt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`bg-surface-container-low border-2 border-dashed rounded-2xl h-40 flex items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                dragOver
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-outline-variant/30 hover:bg-surface-container-lowest hover:border-primary/30'
              } ${uploading ? 'pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-sm">
                  {uploading ? (
                    <Loader2 className="text-primary animate-spin" size={20} />
                  ) : (
                    <Upload className="text-primary" size={20} />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-manrope font-bold">
                    {uploading ? '분석 중...' : '학습 자료 업로드'}
                  </h3>
                  <p className="text-on-surface-variant text-xs opacity-60">
                    {uploading
                      ? '세그먼트 분할 중'
                      : '강의 스크립트, 논문, 노트 (.txt, .md, .srt)'}
                  </p>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-error/10 text-error rounded-xl text-sm">
                {error}
              </div>
            )}
          </section>

          {/* Session count summary */}
          {sessions.length > 0 && (
            <div className="flex items-center gap-4 mb-6 text-xs text-on-surface-variant">
              <span className="font-medium">{sessions.length}개 세션</span>
              <span className="h-3 w-px bg-outline-variant/20" />
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-status-active" /> 정상 {readyCount}
              </span>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" /> 준비 중 {pendingCount}
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-error">
                  <div className="w-1.5 h-1.5 rounded-full bg-error" /> 실패 {errorCount}
                </span>
              )}
            </div>
          )}

          {/* Sessions */}
          <section>
            {sessions.length === 0 ? (
              <div className="py-16 text-center border border-outline-variant/10 rounded-2xl bg-surface-container-lowest/50">
                <Upload size={32} className="mx-auto text-primary/30 mb-4" />
                <p className="text-on-surface-variant text-sm opacity-50">
                  자료를 업로드하면 첫 세션이 생성됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <Card
                    key={s.id}
                    className="group px-6 py-4 cursor-pointer hover:bg-surface-container-lowest flex items-center gap-5"
                    onClick={() => onSessionStart(s.id)}
                  >
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      s.setup_state === 'error'
                        ? 'bg-error'
                        : s.completed
                        ? 'bg-status-active'
                        : s.setup_state === 'pending'
                        ? 'bg-outline-variant animate-pulse'
                        : 'bg-primary'
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-manrope font-bold truncate group-hover:text-primary transition-colors">
                          {s.title}
                        </h3>
                        <Badge
                          variant={
                            s.setup_state === 'error'
                              ? 'error'
                              : s.completed
                              ? 'success'
                              : s.setup_state === 'ready'
                              ? 'primary'
                              : 'surface'
                          }
                        >
                          {s.setup_state === 'error'
                            ? '실패'
                            : s.completed
                            ? '완료'
                            : s.setup_state === 'pending'
                            ? '준비 중'
                            : `${s.completed_count}/${s.segment_count}`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-[11px] text-on-surface-variant opacity-60">
                        <span>{formatDate(s.created_at)}</span>
                        <span className="flex items-center gap-1">
                          <BookOpen size={10} /> {s.segment_count}개 파트
                        </span>
                        <span>${s.cost_usd.toFixed(4)}</span>
                      </div>
                      {/* §G-6 평균 깊이 바 */}
                      {s.avg_depth_label && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-container-lowest rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className={`h-full rounded-full transition-all ${DEPTH_BAR[s.avg_depth_label].color} ${DEPTH_BAR[s.avg_depth_label].width}`}
                            />
                          </div>
                          <span className="text-[10px] text-on-surface-variant opacity-50">
                            {DEPTH_BAR[s.avg_depth_label].label}
                          </span>
                        </div>
                      )}
                      {s.setup_state === 'error' && s.error_message && (
                        <div className="mt-2 text-xs text-error flex items-center gap-1.5">
                          <AlertTriangle size={12} />
                          <span className="truncate">{s.error_message}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-1.5 rounded-lg hover:bg-error/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ArrowRight size={16} className="text-on-surface-variant/30 group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Onboarding steps — only when no sessions */}
          {sessions.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                { step: '01', title: '자료 업로드', desc: 'AI가 핵심 개념 단위로 분할합니다.' },
                { step: '02', title: '함께 탐구', desc: '대화하며 깊이 있게 이해합니다.' },
                { step: '03', title: '성장 확인', desc: '탐구 경로와 깊이를 시각화합니다.' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 text-xs font-bold text-primary border border-primary/20">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{item.title}</h4>
                    <p className="text-xs text-on-surface-variant opacity-60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Side Panel — 접이식 상태 패널 ── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="border-l border-outline-variant/10 bg-surface overflow-hidden shrink-0"
          >
            <div className="w-[360px] h-full overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-manrope font-bold">시스템 상태</h3>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1 rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <PanelRightClose size={16} className="text-on-surface-variant" />
                </button>
              </div>

              {/* Backend Status */}
              <div className="space-y-3 p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="label-sm text-on-surface-variant">백엔드</span>
                  <Badge variant={backendStatus?.llm_ready ? 'success' : 'error'}>
                    {backendStatus?.llm_ready ? 'READY' : 'CHECK'}
                  </Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">서버</span>
                    <span className="font-medium">{backendStatus?.server_ok ? '정상' : '미확인'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">LLM</span>
                    <span className="font-medium">{backendStatus?.backend || '미확인'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Claude CLI</span>
                    <span className="font-medium">{backendStatus?.cli_available ? '감지됨' : '없음'}</span>
                  </div>
                </div>
                {backendStatus?.cli_path && (
                  <div className="text-[10px] text-on-surface-variant break-all bg-surface-container-lowest rounded-lg p-2">
                    {backendStatus.cli_path}
                  </div>
                )}
                {!backendStatus?.llm_ready && (
                  <div className="text-xs text-error bg-error/10 rounded-lg p-2">
                    `claude` CLI 설치와 로그인 상태를 확인하세요.
                  </div>
                )}
              </div>

              {/* Session Diagnostics */}
              <div className="space-y-3 p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-2">
                  <ServerCog size={14} className="text-primary" />
                  <span className="label-sm text-on-surface-variant">세션 상태</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-surface-container-lowest p-3 text-center">
                    <div className="text-lg font-bold">{readyCount}</div>
                    <div className="text-[9px] text-on-surface-variant">정상</div>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-3 text-center">
                    <div className="text-lg font-bold">{pendingCount}</div>
                    <div className="text-[9px] text-on-surface-variant">처리 중</div>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-3 text-center">
                    <div className="text-lg font-bold text-error">{errorCount}</div>
                    <div className="text-[9px] text-on-surface-variant">실패</div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3 p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-primary" />
                  <span className="label-sm text-on-surface-variant">점검 순서</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 text-status-active shrink-0" />
                    <span>Claude CLI 감지 여부 확인</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 text-status-active shrink-0" />
                    <span>세션 카드 상태 확인 (실패 여부)</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 text-status-active shrink-0" />
                    <span>학습 화면에서 메시지 수신 확인</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  loadSessions();
                  loadBackendStatus();
                }}
                className="w-full py-3 bg-surface-container-low rounded-xl label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={12} /> 상태 새로고침
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
