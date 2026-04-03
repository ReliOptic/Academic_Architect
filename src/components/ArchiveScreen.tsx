import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  CheckCircle2,
  BookOpen,
  FileDown,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/PageHeader';
import { SectionHeader } from './ui/SectionHeader';
import * as api from '../api';
import type { Session, SessionListItem, SegmentInfo, SegmentState } from '../types';

export default function ArchiveScreen() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<Session | null>(null);

  useEffect(() => {
    api.listSessions().then((all) => {
      const completed = all.filter((s) => s.completed);
      setSessions(completed);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedId) {
      api.getSession(selectedId).then(setSessionDetail).catch(() => {});
    }
  }, [selectedId]);

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const exportMarkdown = () => {
    if (!sessionDetail) return;
    const lines: string[] = [];
    lines.push(`# ${sessionDetail.title}`);
    lines.push('');
    lines.push(`- 날짜: ${formatDate(sessionDetail.created_at)}`);
    lines.push(`- 파트 수: ${sessionDetail.segments?.length || 0}`);
    lines.push(`- 토큰: ${((sessionDetail.total_input_tokens || 0) + (sessionDetail.total_output_tokens || 0)).toLocaleString()}`);
    lines.push(`- 비용: $${sessionDetail.cost_usd?.toFixed(4) || '0'}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    sessionDetail.segments?.forEach((seg: SegmentInfo, i: number) => {
      const st = sessionDetail.segment_states?.[i];
      lines.push(`## ${i + 1}. ${seg.title}`);
      lines.push('');
      lines.push(`- 핵심 개념: ${seg.core_concept}`);
      if (st) {
        lines.push(`- 탐구 깊이: ${st.depth_label}`);
        if (st.preview_prediction) {
          lines.push(`- 내 예측: ${st.preview_prediction}`);
        }
      }
      lines.push('');
      if (st?.summary) {
        lines.push('### 요약');
        lines.push('');
        lines.push(st.summary);
        lines.push('');
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionDetail.title || 'archive'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-12 py-20">
      <PageHeader
        title="학습 아카이브"
        badge="탐구 기록"
        description="완료된 학습 세션의 기록입니다. 탐구 경로와 깊이를 되돌아볼 수 있습니다."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Session List */}
        <div className="lg:col-span-4 space-y-6">
          <SectionHeader label="완료된 세션" className="px-2" />

          {sessions.length === 0 ? (
            <div className="py-20 text-center border border-outline-variant/10 rounded-2xl bg-surface-container-lowest/50">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                완료된 세션이 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <Card
                  key={s.id}
                  variant={selectedId === s.id ? 'lowest' : 'low'}
                  className={`p-5 cursor-pointer group ${
                    selectedId === s.id
                      ? 'border-primary shadow-ambient'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  hover={selectedId !== s.id}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="success">완료</Badge>
                    <span className="label-md text-[9px] text-on-surface-variant opacity-60">
                      {formatDate(s.created_at)}
                    </span>
                  </div>
                  <h4 className="font-manrope font-bold leading-tight">{s.title}</h4>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <BookOpen size={10} /> {s.segment_count}개 파트
                    </span>
                    <span>${s.cost_usd.toFixed(4)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-8 space-y-10">
          {sessionDetail ? (
            <div className="bg-surface-container-low p-12 rounded-2xl border border-outline-variant/10 space-y-8">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="headline-md">{sessionDetail.title}</h2>
                  <div className="flex gap-4 text-xs text-on-surface-variant">
                    <span>{formatDate(sessionDetail.created_at)}</span>
                    <span>{sessionDetail.segments?.length}개 파트</span>
                    <span>토큰: {(sessionDetail.total_input_tokens + sessionDetail.total_output_tokens).toLocaleString()}</span>
                    <span>${sessionDetail.cost_usd?.toFixed(4)}</span>
                  </div>
                </div>
                <button
                  onClick={exportMarkdown}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
                >
                  <FileDown size={14} /> MD 내보내기
                </button>
              </div>

              <div className="space-y-4">
                <SectionHeader icon={BarChart3} label="탐구 깊이 요약" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sessionDetail.segment_states?.map((st: SegmentState, i: number) => {
                    const seg: SegmentInfo | undefined = sessionDetail.segments?.[i];
                    return (
                      <div key={i} className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                        <div className="label-sm text-on-surface-variant mb-1 truncate">
                          {seg?.title}
                        </div>
                        <div className="text-sm font-bold text-primary">{st.depth_label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <SectionHeader icon={BookOpen} label="세그먼트별 요약" />
                <div className="space-y-3">
                  {sessionDetail.segment_states?.map((st: SegmentState, i: number) => {
                    const seg: SegmentInfo | undefined = sessionDetail.segments?.[i];
                    return st.summary ? (
                      <div key={i} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                        <div className="text-xs font-bold mb-1">{seg?.title}</div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{st.summary}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-low p-12 rounded-2xl border border-outline-variant/10 space-y-10">
              <div className="space-y-4">
                <h2 className="headline-md">학습 아카이브</h2>
                <p className="text-on-surface-variant leading-relaxed opacity-70">
                  완료된 세션을 선택하면 탐구 깊이와 요약을 확인할 수 있습니다.
                  각 세션은 세그먼트별 핵심 개념, 탐구 깊이, 학습자의 이해 수준을 기록합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <SectionHeader icon={BarChart3} label="깊이 추적" />
                  <p className="text-xs text-on-surface-variant leading-relaxed opacity-60">
                    각 파트에서 도달한 탐구 깊이를 기록합니다.
                    표면 탐색 → 구조 파악 → 핵심 도달 → 심층 연결.
                  </p>
                </div>
                <div className="space-y-4">
                  <SectionHeader icon={Download} label="마크다운 내보내기" />
                  <p className="text-xs text-on-surface-variant leading-relaxed opacity-60">
                    완료된 세션은 마크다운 보고서로 내보낼 수 있습니다.
                    Obsidian, Notion 등과 호환됩니다.
                  </p>
                </div>
              </div>

              <div className="pt-10 border-t border-outline-variant/10">
                <div className="flex items-center gap-4 text-primary opacity-40">
                  <CheckCircle2 size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
                    {sessions.length === 0
                      ? '첫 세션 완료를 기다리는 중'
                      : '왼쪽에서 세션을 선택하세요'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
