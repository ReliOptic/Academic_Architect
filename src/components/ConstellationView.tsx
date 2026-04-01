/**
 * Knowledge Constellation (§G-2) — 지식 별자리 시각화.
 *
 * depends_on 기반 그래프를 SVG로 렌더링.
 * 노드: 세그먼트, 완료 시 점등, 깊이에 따라 크기/밝기 변화.
 * 엣지: depends_on (실선), cross_segment_link (점선, 하이라이트).
 */

import type { ConstellationData, ConstellationNode, ConstellationEdge } from '../types';

interface Props {
  data: ConstellationData;
  currentSegmentId?: number;
  className?: string;
}

const DEPTH_COLORS: Record<string, string> = {
  '표면 탐색': '#9CA3AF',
  '구조 파악': '#8B5CF6',
  '핵심 도달': '#3c06a7',
  '심층 연결': '#10B981',
};

function layoutNodes(nodes: ConstellationNode[]) {
  // Simple circular layout
  const cx = 150;
  const cy = 150;
  const r = 100;
  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return {
      ...node,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

export default function ConstellationView({ data, currentSegmentId, className = '' }: Props) {
  if (!data.nodes.length) {
    return (
      <div className={`flex items-center justify-center h-full text-on-surface-variant/40 text-[10px] uppercase tracking-widest ${className}`}>
        별자리 생성 대기 중
      </div>
    );
  }

  const positioned = layoutNodes(data.nodes);
  const nodeMap = new Map(positioned.map((n) => [n.id, n]));

  return (
    <div className={className}>
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Edges */}
        {data.edges.map((edge, i) => {
          const src = nodeMap.get(edge.source);
          const tgt = nodeMap.get(edge.target);
          if (!src || !tgt) return null;
          return (
            <line
              key={`e-${i}`}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={edge.is_cross_link ? '#8B5CF6' : '#4B5563'}
              strokeWidth={edge.is_cross_link ? 2 : 1}
              strokeDasharray={edge.is_cross_link ? '4 2' : edge.is_dependency ? '' : '2 2'}
              opacity={edge.is_cross_link ? 0.8 : 0.3}
            />
          );
        })}

        {/* Nodes */}
        {positioned.map((node) => {
          const color = DEPTH_COLORS[node.depth_label] || '#6B7280';
          const radius = node.completed ? 8 + node.level * 2 : 6;
          const isCurrent = node.id === currentSegmentId;

          return (
            <g key={node.id}>
              {/* Glow for deep level */}
              {node.completed && node.level >= 4 && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 6}
                  fill={color}
                  opacity={0.15}
                />
              )}
              {/* Current indicator */}
              {isCurrent && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 4}
                  fill="none"
                  stroke="#3c06a7"
                  strokeWidth={2}
                  opacity={0.5}
                >
                  <animate
                    attributeName="r"
                    values={`${radius + 4};${radius + 8};${radius + 4}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0.2;0.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={node.completed ? color : 'transparent'}
                stroke={color}
                strokeWidth={node.completed ? 0 : 1.5}
                opacity={node.completed ? 1 : 0.3}
              />
              {/* Label */}
              <text
                x={node.x}
                y={node.y + radius + 12}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize={8}
                opacity={node.completed ? 0.8 : 0.3}
              >
                {node.title.length > 8 ? node.title.slice(0, 8) + '…' : node.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
