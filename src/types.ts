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
  messages?: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    phase: Phase;
    metadata?: Record<string, unknown>;
  }[];
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
  setup_state: 'pending' | 'ready' | 'error';
  error_message: string;
  events?: SessionEvent[];
  preview_participation_rate?: number | null;
  discuss_entry_rate?: number | null;
  natural_transition_rate?: number | null;
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
  setup_state: 'pending' | 'ready' | 'error';
  error_message: string;
  avg_depth_label: DepthLabel | null;
}

export interface SessionEvent {
  timestamp: number;
  event_type: string;
  segment_id: number;
  metadata?: Record<string, unknown>;
}

export interface BackendStatus {
  backend: string;
  server_ok: boolean;
  llm_ready: boolean;
  cli_available: boolean;
  cli_path: string;
  sessions_dir: string;
  uploads_dir: string;
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

// Legacy types removed — ModelSettingsScreen simplified
