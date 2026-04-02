import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  ArrowRight,
  Loader2,
  Trash2,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ServerCog,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { SectionHeader } from './ui/SectionHeader';
import * as api from '../api';
import type { BackendStatus, SessionListItem } from '../types';

interface Props {
  onSessionStart: (sessionId: string) => void;
}

export default function DashboardScreen({ onSessionStart }: Props) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
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

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await api.createSession(file);
      onSessionStart(result.session_id);
    } catch (e: any) {
      setError(e.message);
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
    await api.deleteSession(id);
    loadSessions();
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-12 py-20">
      <PageHeader
        title="학습 대시보드"
        description="업로드 성공 여부만이 아니라, AI 백엔드 준비 상태와 세션 초기화 실패 원인까지 바로 확인할 수 있도록 구성된 운영 화면입니다."
        actions={
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                loadSessions();
                loadBackendStatus();
              }}
              className="ghost-border px-4 py-2 rounded-sm label-md text-on-surface-variant hover:text-primary transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} /> 상태 새로고침
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ghost-border px-6 py-2 rounded-sm label-md text-primary hover:bg-primary hover:text-white transition-all"
            >
              새 학습 시작
            </button>
          </div>
        }
      />

      <section className="mb-12 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card variant="lowest" hover={false} className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="label-md text-[10px] text-on-surface-variant">백엔드 상태</div>
              <h3 className="font-manrope font-bold text-xl mt-1">FastAPI / LLM</h3>
            </div>
            <Badge variant={backendStatus?.llm_ready ? 'success' : 'error'}>
              {backendStatus?.llm_ready ? 'READY' : 'CHECK'}
            </Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">서버</span>
              <span className="font-medium">{backendStatus?.server_ok ? '정상' : '미확인'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">LLM 백엔드</span>
              <span className="font-medium">{backendStatus?.backend || '미확인'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">Claude CLI</span>
              <span className="font-medium">{backendStatus?.cli_available ? '감지됨' : '없음'}</span>
            </div>
          </div>
          {backendStatus?.cli_path && (
            <div className="text-[11px] text-on-surface-variant break-all bg-surface-container-low rounded-xl p-3">
              {backendStatus.cli_path}
            </div>
          )}
          {!backendStatus?.llm_ready && (
            <div className="text-xs text-error bg-error/10 rounded-xl p-3">
              모델 호출 전 단계에서 막혀 있을 수 있습니다. `claude` CLI 설치와 로그인 상태를 먼저 확인하세요.
            </div>
          )}
        </Card>

        <Card variant="lowest" hover={false} className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="label-md text-[10px] text-on-surface-variant">세션 진단</div>
              <h3 className="font-manrope font-bold text-xl mt-1">업로드 이후 상태</h3>
            </div>
            <ServerCog size={18} className="text-primary" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-surface-container-low p-4">
              <div className="text-[10px] text-on-surface-variant">정상</div>
              <div className="text-2xl font-bold mt-1">
                {sessions.filter((s) => s.setup_state === 'ready').length}
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <div className="text-[10px] text-on-surface-variant">처리 중</div>
              <div className="text-2xl font-bold mt-1">
                {sessions.filter((s) => s.setup_state === 'pending').length}
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <div className="text-[10px] text-on-surface-variant">실패</div>
              <div className="text-2xl font-bold mt-1 text-error">
                {sessions.filter((s) => s.setup_state === 'error').length}
              </div>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            업로드만 성공하고 세그먼트 분할이나 모델 호출이 실패하는 경우, 아래 세션 카드에 원인이 표시됩니다.
          </p>
        </Card>

        <Card variant="lowest" hover={false} className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="label-md text-[10px] text-on-surface-variant">권장 점검 순서</div>
              <h3 className="font-manrope font-bold text-xl mt-1">실작동 확인</h3>
            </div>
            <Bot size={18} className="text-primary" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <CheckCircle2 size={16} className="mt-0.5 text-status-active shrink-0" />
              <p>상단 카드에서 Claude CLI 감지 여부를 확인합니다.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 size={16} className="mt-0.5 text-status-active shrink-0" />
              <p>업로드 후 세션 카드가 `초기화 실패`가 아닌지 확인합니다.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 size={16} className="mt-0.5 text-status-active shrink-0" />
              <p>학습 화면에서 Preview 또는 Probe 메시지가 실제로 나타나는지 확인합니다.</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Upload Area */}
      <section className="mb-20">
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
          className={`bg-surface-container-low border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
            dragOver
              ? 'border-primary/60 bg-primary/5'
              : 'border-outline-variant/30 hover:bg-surface-container-lowest hover:border-primary/30'
          } ${uploading ? 'pointer-events-none' : ''}`}
        >
          <div className="z-10 text-center space-y-4">
            <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mx-auto shadow-ambient group-hover:scale-110 transition-transform">
              {uploading ? (
                <Loader2 className="text-primary animate-spin" size={24} />
              ) : (
                <Upload className="text-primary" size={24} />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="headline-sm">
                {uploading ? '분석 중...' : '학습 자료 업로드'}
              </h3>
              <p className="text-on-surface-variant text-xs max-w-md mx-auto leading-relaxed opacity-60">
                {uploading
                  ? '스크립트를 세그먼트로 분할하고 있습니다'
                  : '강의 스크립트, 논문, 노트를 드래그하거나 클릭하세요 (.txt, .md, .srt)'}
              </p>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-error/10 text-error rounded-xl text-sm">
            {error}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        {[
          { step: '01', title: '자료 업로드', desc: '학습 자료를 업로드하면 AI가 핵심 개념 단위로 분할합니다.' },
          { step: '02', title: '함께 탐구', desc: '각 파트를 탐구 동료와 대화하며 깊이 있게 이해합니다.' },
          { step: '03', title: '성장 확인', desc: '지식 별자리로 탐구 경로와 깊이를 시각적으로 확인합니다.' },
        ].map((item) => (
          <div key={item.step} className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 font-bold text-primary border border-primary/20">
              {item.step}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">{item.title}</h4>
              <p className="text-sm text-on-surface-variant opacity-70">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <SectionHeader label="최근 학습 세션" className="text-primary font-bold" />
        </div>

        {sessions.length === 0 ? (
          <div className="py-20 text-center border border-outline-variant/10 rounded-2xl bg-surface-container-lowest/50">
            <p className="text-on-surface-variant text-sm italic opacity-40">
              아직 학습 세션이 없습니다. 자료를 업로드하여 시작하세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sessions.map((s) => (
              <Card
                key={s.id}
                className="group cursor-pointer hover:bg-surface-container-lowest p-6"
                onClick={() => onSessionStart(s.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="surface">
                    <Clock size={10} className="inline mr-1" />
                    {formatDate(s.created_at)}
                  </Badge>
                  <div className="flex gap-2 items-center">
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
                        ? '초기화 실패'
                        : s.completed
                        ? '완료'
                        : s.setup_state === 'pending'
                        ? '준비 중'
                        : `${s.completed_count}/${s.segment_count}`}
                    </Badge>
                    <button
                      onClick={(e) => handleDelete(s.id, e)}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-manrope font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {s.title}
                </h3>
                {s.setup_state === 'error' && (
                  <div className="mb-3 rounded-xl bg-error/10 text-error text-xs p-3 flex gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{s.error_message || '세션 초기화 중 오류가 발생했습니다.'}</span>
                  </div>
                )}
                {s.setup_state === 'pending' && (
                  <div className="mb-3 rounded-xl bg-surface-container-high text-on-surface-variant text-xs p-3">
                    업로드는 되었지만 아직 세그먼트 준비가 끝나지 않았습니다.
                  </div>
                )}
                <div className="flex items-center gap-3 mt-4 text-[10px] text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <BookOpen size={10} /> {s.segment_count}개 파트
                  </span>
                  <span>${s.cost_usd.toFixed(4)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
