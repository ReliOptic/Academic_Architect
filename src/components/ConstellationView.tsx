/**
 * Knowledge Constellation (§G-2) — 지식 별자리 시각화.
 * depends_on 기반 계층 레이아웃 + §G-6 깊이 게이지 4단계.
 * §G-4 엣지 스타일: depends_on=실선+화살표, cross_segment_link=점선+primary+펄스.
 */

import { useMemo, useState, useCallback } from 'react';
import type { ConstellationData, ConstellationNode, ConstellationEdge } from '../types';

interface Props {
  data: ConstellationData;
  currentSegmentId?: number;
  className?: string;
}

// §G-6 깊이 게이지 색상 (디자인 토큰 기반)
const DEPTH_STYLES: Record<string, { fill: string; glow: boolean; opacity: number }> = {
  '표면 탐색': { fill: 'var(--color-on-surface-variant)', glow: false, opacity: 0.6 },
  '구조 파악': { fill: 'var(--color-primary)', glow: false, opacity: 0.7 },
  '핵심 도달': { fill: 'var(--color-primary)', glow: false, opacity: 1.0 },
  '심층 연결': { fill: 'var(--color-status-active)', glow: true, opacity: 1.0 },
};

interface PositionedNode extends ConstellationNode {
  x: number;
  y: number;
}

function layoutNodes(nodes: ConstellationNode[], edges: ConstellationEdge[]): PositionedNode[] {
  if (nodes.length === 0) return [];

  // depends_on 기반 계층(layer) 배치
  const depMap = new Map<number, number[]>();
  for (const e of edges) {
    if (e.is_dependency) {
      const deps = depMap.get(e.target) ?? [];
      deps.push(e.source);
      depMap.set(e.target, deps);
    }
  }

  // 위상정렬로 레이어 결정
  const layers = new Map<number, number>();
  const visited = new Set<number>();

  function getLayer(id: number): number {
    if (layers.has(id)) return layers.get(id)!;
    if (visited.has(id)) return 0; // 순환 방지
    visited.add(id);
    const deps = depMap.get(id) ?? [];
    const maxDep = deps.length > 0 ? Math.max(...deps.map(getLayer)) + 1 : 0;
    layers.set(id, maxDep);
    return maxDep;
  }

  for (const n of nodes) getLayer(n.id);

  // 레이어별 노드 그룹화
  const layerGroups = new Map<number, ConstellationNode[]>();
  for (const n of nodes) {
    const layer = layers.get(n.id) ?? 0;
    const group = layerGroups.get(layer) ?? [];
    group.push(n);
    layerGroups.set(layer, group);
  }

  const maxLayer = Math.max(...layerGroups.keys(), 0);
  const cx = 150;
  const positioned: PositionedNode[] = [];

  for (const [layer, group] of layerGroups) {
    const y = maxLayer === 0 ? 150 : 40 + (layer / maxLayer) * 220;
    const totalWidth = 260;
    const spacing = group.length > 1 ? totalWidth / (group.length - 1) : 0;
    const startX = group.length > 1 ? cx - totalWidth / 2 : cx;

    group.forEach((node, i) => {
      positioned.push({
        ...node,
        x: startX + i * spacing,
        y,
      });
    });
  }

  return positioned;
}

export default function ConstellationView({ data, currentSegmentId, className = '' }: Props) {
  const positioned = useMemo(() => layoutNodes(data.nodes, data.edges), [data.nodes, data.edges]);
  const nodeMap = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned]);

  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

  const handleEdgeEnter = useCallback((i: number) => setHoveredEdge(i), []);
  const handleEdgeLeave = useCallback(() => setHoveredEdge(null), []);

  if (!data.nodes.length) {
    return (
      <div className={`flex items-center justify-center h-full text-on-surface-variant/40 text-xs ${className}`}>
        아직 탐구한 파트가 없어요
      </div>
    );
  }

  return (
    <div className={className}>
      <svg viewBox="0 0 300 300" className="w-full h-full" role="img" aria-label="지식 별자리 — 탐구한 개념들의 관계도">
        <defs>
          {/* depends_on 화살표 마커 */}
          <marker id="arrow-dep" viewBox="0 0 10 10" refX="10" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-outline-variant)" />
          </marker>
          {/* cross_segment_link 화살표 마커 (primary) */}
          <marker id="arrow-cross" viewBox="0 0 10 10" refX="10" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-primary)" />
          </marker>
        </defs>

        {/* Edges */}
        {data.edges.map((edge, i) => {
          const src = nodeMap.get(edge.source);
          const tgt = nodeMap.get(edge.target);
          if (!src || !tgt) return null;
          const isHovered = hoveredEdge === i;

          const isCross = edge.is_cross_link;
          const isDep = edge.is_dependency;

          return (
            <g key={`e-${i}`}
              onMouseEnter={() => handleEdgeEnter(i)}
              onMouseLeave={handleEdgeLeave}
            >
              {/* 투명한 넓은 히트 영역 */}
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke="transparent" strokeWidth={12}
              />
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isCross ? 'var(--color-primary)' : 'var(--color-outline-variant)'}
                strokeWidth={isCross ? 2 : 1}
                strokeDasharray={isCross ? '6 3' : isDep ? '' : '2 2'}
                opacity={isHovered ? 1 : isCross ? 0.8 : 0.3}
                markerEnd={isDep ? 'url(#arrow-dep)' : isCross ? 'url(#arrow-cross)' : undefined}
                className={isCross ? 'animate-pulse' : ''}
              />
              {/* 호버 툴팁 */}
              {isHovered && (
                <text
                  x={(src.x + tgt.x) / 2}
                  y={(src.y + tgt.y) / 2 - 8}
                  textAnchor="middle"
                  fill="var(--color-on-surface)"
                  fontSize={7}
                  className="pointer-events-none"
                >
                  {src.title} → {tgt.title}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {positioned.map((node) => {
          const style = DEPTH_STYLES[node.depth_label] ?? DEPTH_STYLES['표면 탐색'];
          const radius = node.completed ? 8 + node.level * 1.5 : 6;
          const isCurrent = node.id === currentSegmentId;

          return (
            <g key={node.id}>
              {/* §G-6: L4~L5 glow effect */}
              {node.completed && style.glow && (
                <circle cx={node.x} cy={node.y} r={radius + 8} fill={style.fill} opacity={0.15}>
                  <animate attributeName="opacity" values="0.15;0.08;0.15" dur="3s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Current segment pulse */}
              {isCurrent && (
                <circle cx={node.x} cy={node.y} r={radius + 4} fill="none" stroke="var(--color-primary)" strokeWidth={2} opacity={0.4}>
                  <animate attributeName="r" values={`${radius + 4};${radius + 8};${radius + 4}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Node circle — §G-6 4단계 */}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={node.completed ? style.fill : 'transparent'}
                stroke={node.completed ? 'none' : style.fill}
                strokeWidth={node.completed ? 0 : 1.5}
                opacity={node.completed ? style.opacity : 0.25}
                className="transition-all duration-700"
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + radius + 14}
                textAnchor="middle"
                fill="var(--color-on-surface-variant)"
                fontSize={8}
                opacity={node.completed ? 0.7 : 0.25}
              >
                {node.title.length > 10 ? node.title.slice(0, 10) + '…' : node.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
