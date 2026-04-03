import {
  BarChart3,
  Map,
  MessageCircle,
  Save,
  X,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SectionHeader } from '../ui/SectionHeader';
import ConstellationView from '../ConstellationView';
import type { Session, SegmentInfo, SegmentState, ConstellationData, Phase } from '../../types';

const DEPTH_LABELS: Record<string, { label: string; color: string }> = {
  '표면 탐색': { label: '표면 탐색', color: 'text-on-surface-variant' },
  '구조 파악': { label: '구조 파악', color: 'text-tertiary' },
  '핵심 도달': { label: '핵심 도달', color: 'text-primary' },
  '심층 연결': { label: '심층 연결', color: 'text-status-active' },
};

interface StatsSidebarProps {
  show: boolean;
  onClose: () => void;
  session: Session | null;
  currentState: SegmentState | null | undefined;
  currentSeg: SegmentInfo | null | undefined;
  constellation: ConstellationData | null;
  phase?: Phase;
  onNavigateArchive?: () => void;
}

export default function StatsSidebar({
  show,
  onClose,
  session,
  currentState,
  currentSeg,
  constellation,
  phase,
  onNavigateArchive,
}: StatsSidebarProps) {
  return (
    <aside className={`
      fixed inset-y-0 right-0 z-40 w-80 md:w-96 bg-surface border-l border-outline-variant/5 p-8 space-y-10 overflow-y-auto
      transform transition-transform duration-200 ease-in-out
      ${show ? 'translate-x-0' : 'translate-x-full'}
      md:static md:translate-x-0 md:z-auto
    `}>
      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="md:hidden p-1.5 rounded-lg hover:bg-surface-container-high transition-colors self-end"
        aria-label="통계 패널 닫기"
      >
        <X size={18} />
      </button>

      {/* Depth Gauge */}
      <div className="space-y-4">
        <SectionHeader icon={BarChart3} label="탐구 깊이" />
        <Card variant="low" hover={false} className="p-6 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <div className={`font-manrope text-4xl font-extrabold ${
                currentState?.completed
                  ? DEPTH_LABELS[currentState.depth_label]?.color || ''
                  : 'text-on-surface-variant'
              }`}>
                {currentState?.depth_label || '대기'}
              </div>
              <div className="text-xs font-medium text-on-surface-variant">
                {currentSeg?.core_concept || ''}
              </div>
            </div>
            <Badge variant={currentState?.completed ? 'success' : 'surface'}>
              {currentState?.completed ? '완료' : '진행중'}
            </Badge>
          </div>
          {/* Level trend bars */}
          <div className="flex gap-1.5 h-2">
            {session?.segment_states.map((st, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all ${
                  st.completed
                    ? st.level >= 4 ? 'bg-status-active' :
                      st.level >= 3 ? 'bg-primary' :
                      st.level >= 2 ? 'bg-tertiary' :
                      'bg-on-surface-variant/30'
                    : 'bg-surface-container-high'
                }`}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Preview vs Actual */}
      {(() => {
        let previewState = currentState?.preview_prediction && currentState?.completed ? currentState : null;
        let previewSeg: SegmentInfo | null | undefined = previewState ? currentSeg : null;
        if (!previewState && session) {
          for (let i = session.segment_states.length - 1; i >= 0; i--) {
            const st = session.segment_states[i];
            if (st.completed && st.preview_prediction) {
              previewState = st;
              previewSeg = session.segments[i];
              break;
            }
          }
        }
        if (!previewState || !previewSeg) return null;
        return (
          <div className="space-y-4">
            <SectionHeader icon={MessageCircle} label="예측 vs 실제" />
            <Card variant="lowest" hover={false} className="p-4 space-y-3">
              <div>
                <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">내 예측</div>
                <p className="text-xs text-on-surface-variant/70">{previewState.preview_prediction}</p>
              </div>
              <div>
                <div className="text-xs font-bold text-primary uppercase mb-1">실제 내용</div>
                <p className="text-xs">{previewSeg.core_concept}</p>
              </div>
              {previewSeg !== currentSeg && (
                <div className="text-xs text-on-surface-variant/40 italic">
                  파트: {previewSeg.title}
                </div>
              )}
            </Card>
          </div>
        );
      })()}

      {/* Knowledge Constellation (§G-2) */}
      <div className="space-y-4">
        <SectionHeader icon={Map} label="지식 별자리" />
        <div className="h-64 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-2">
          <ConstellationView
            data={constellation || { nodes: [], edges: [] }}
            currentSegmentId={currentSeg?.id}
          />
        </div>
      </div>

      {phase === 'complete' && onNavigateArchive ? (
        <button
          onClick={onNavigateArchive}
          aria-label="세션 아카이브"
          className="w-full py-4 bg-primary text-white rounded-xl label-md text-[10px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Save size={14} /> 세션 아카이브
        </button>
      ) : (
        <button
          aria-label="세션 아카이브"
          aria-disabled="true"
          className="w-full py-4 bg-surface-container-high rounded-xl label-md text-[10px] text-on-surface-variant flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
        >
          <Save size={14} /> 세션 아카이브
        </button>
      )}
    </aside>
  );
}
