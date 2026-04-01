// ── Backend-aligned types ──

export type Phase =
  | 'idle'
  | 'segmenting'
  | 'preview'
  | 'probing'
  | 'analyzing'
  | 'hinting'
  | 'delivering'
  | 'discussing'
  | 'compressing'
  | 'challenge_prompt'
  | 'challenge_feedback'
  | 'complete';

export type DepthLabel = '표면 탐색' | '구조 파악' | '핵심 도달' | '심층 연결';

export interface SegmentInfo {
  id: number;
  title: string;
  core_concept: string;
}

export interface SegmentState {
  segment_id: number;
  phase: Phase;
  level: number;
  depth_label: DepthLabel;
  completed: boolean;
  preview_prediction: string;
  summary: string;
}

export interface Session {
  id: string;
  title: string;
  created_at: number;
  phase: Phase;
  segments: SegmentInfo[];
  segment_states: SegmentState[];
  current_segment_index: number;
  completed_count: number;
  completed: boolean;
  cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

export interface SessionListItem {
  id: string;
  title: string;
  created_at: number;
  segment_count: number;
  completed_count: number;
  completed: boolean;
  cost_usd: number;
  phase: Phase;
}

export interface ProbeResponse {
  question: string;
  segment: { id: number; title: string };
  phase: Phase;
}

export interface AnswerResponse {
  phase: Phase | 'hinting';
  level: number;
  confidence: string;
  depth_label?: DepthLabel;
  delivery?: string;
  hint?: string;
  needs_reanswer: boolean;
}

export interface DiscussResponse {
  reply: string;
  cross_segment_link: boolean;
  end_segment: boolean;
  phase: Phase;
  next_phase?: Phase;
  challenge_available?: boolean;
}

export interface ConstellationNode {
  id: number;
  title: string;
  depth_label: DepthLabel;
  level: number;
  completed: boolean;
}

export interface ConstellationEdge {
  source: number;
  target: number;
  is_dependency: boolean;
  is_cross_link: boolean;
}

export interface ConstellationData {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
}

// ── Legacy types (kept for existing UI components) ──

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM';
  message: string;
  source?: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
}

export interface Engine {
  id: string;
  name: string;
  icon: any;
  description: string;
  cost?: string;
  badge?: string;
  recommended?: boolean;
}
