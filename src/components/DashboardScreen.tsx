import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  ArrowRight,
  Loader2,
  Trash2,
  Clock,
  BookOpen,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { SectionHeader } from './ui/SectionHeader';
import * as api from '../api';
import type { SessionListItem } from '../types';

interface Props {
  onSessionStart: (sessionId: string) => void;
}

export default function DashboardScreen({ onSessionStart }: Props) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const list = await api.listSessions();
      setSessions(list);
    } catch {
      // Backend may not be running yet
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
        actions={
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="label-md text-[10px] text-primary">SYSTEM READY</span>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ghost-border px-6 py-2 rounded-sm label-md text-primary hover:bg-primary hover:text-white transition-all"
            >
              새 학습 시작
            </button>
          </div>
        }
      />

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

      {/* How It Works */}
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
                    <Badge variant={s.completed ? 'success' : 'primary'}>
                      {s.completed ? '완료' : `${s.completed_count}/${s.segment_count}`}
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
