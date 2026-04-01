from __future__ import annotations

import time
import uuid
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ── Enums ──

class Phase(str, Enum):
    IDLE = "idle"
    SEGMENTING = "segmenting"
    PREVIEW = "preview"
    PROBING = "probing"
    ANALYZING = "analyzing"
    HINTING = "hinting"
    DELIVERING = "delivering"
    DISCUSSING = "discussing"
    COMPRESSING = "compressing"
    CHALLENGE_PROMPT = "challenge_prompt"
    CHALLENGE_FEEDBACK = "challenge_feedback"
    COMPLETE = "complete"


class DepthLabel(str, Enum):
    SURFACE = "표면 탐색"
    STRUCTURE = "구조 파악"
    CORE = "핵심 도달"
    DEEP = "심층 연결"

    @classmethod
    def from_level(cls, level: int) -> DepthLabel:
        if level <= 1:
            return cls.SURFACE
        if level == 2:
            return cls.STRUCTURE
        if level == 3:
            return cls.CORE
        return cls.DEEP


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# ── Segment ──

class Segment(BaseModel):
    id: int
    title: str
    core_concept: str
    key_terms: list[str] = []
    depends_on: list[int] = []
    token_count: int = 0
    transcript: str = ""


# ── Probe / Level ──

class ProbeResult(BaseModel):
    detected_signals: list[str] = []
    conceptual_content: str = ""
    level: int = 2
    confidence: str = "high"  # "high" | "low"
    reasoning: str = ""


class LevelInfo(BaseModel):
    level: int = 0
    depth_label: DepthLabel = DepthLabel.SURFACE
    confidence: str = "high"
    probe_question: str = ""
    user_answer: str = ""
    reasoning: str = ""


# ── Message ──

class Message(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    role: MessageRole
    content: str
    timestamp: float = Field(default_factory=time.time)
    phase: Phase = Phase.IDLE
    metadata: dict[str, Any] = {}


# ── Segment State ──

class SegmentState(BaseModel):
    segment_id: int
    phase: Phase = Phase.PREVIEW
    level_info: LevelInfo = Field(default_factory=LevelInfo)
    messages: list[Message] = []
    preview_prediction: str = ""
    cross_segment_links: list[int] = []
    summary: str = ""
    completed: bool = False


# ── Session ──

class Session(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    title: str = ""
    created_at: float = Field(default_factory=time.time)
    script_filename: str = ""
    segments: list[Segment] = []
    segment_states: list[SegmentState] = []
    current_segment_index: int = 0
    phase: Phase = Phase.IDLE
    cost_usd: float = 0.0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    completed: bool = False

    @property
    def current_segment(self) -> Segment | None:
        if 0 <= self.current_segment_index < len(self.segments):
            return self.segments[self.current_segment_index]
        return None

    @property
    def current_state(self) -> SegmentState | None:
        if 0 <= self.current_segment_index < len(self.segment_states):
            return self.segment_states[self.current_segment_index]
        return None

    @property
    def completed_count(self) -> int:
        return sum(1 for s in self.segment_states if s.completed)

    @property
    def understood_concepts(self) -> list[str]:
        concepts = []
        for st in self.segment_states:
            if st.completed and st.level_info.level >= 2:
                seg = next((s for s in self.segments if s.id == st.segment_id), None)
                if seg:
                    concepts.append(seg.core_concept)
        return concepts

    @property
    def level_trend(self) -> list[int]:
        return [st.level_info.level for st in self.segment_states if st.completed]


# ── Constellation ──

class ConstellationNode(BaseModel):
    id: int
    title: str
    depth_label: DepthLabel = DepthLabel.SURFACE
    level: int = 0
    completed: bool = False


class ConstellationEdge(BaseModel):
    source: int
    target: int
    is_dependency: bool = True
    is_cross_link: bool = False


class ConstellationData(BaseModel):
    nodes: list[ConstellationNode] = []
    edges: list[ConstellationEdge] = []


# ── API request / response ──

class UserMessageRequest(BaseModel):
    content: str


class PreviewRequest(BaseModel):
    prediction: str


# ── LLM usage ──

class LLMUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    model: str = ""
    session_id: str = ""
