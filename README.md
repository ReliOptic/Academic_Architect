# Academic Architect

Academic Architect는 긴 학습 자료를 세그먼트 단위로 분해하고, 사용자와 AI가 `Preview → Probe → Deliver → Discuss` 흐름으로 함께 탐구하도록 설계된 로컬 학습 에이전트 프로토타입입니다. 현재 구현은 React + Vite 프론트엔드와 FastAPI 백엔드, 그리고 `claude -p` 기반 CLI 백엔드를 중심으로 구성되어 있습니다.

## 개발 배경

이 프로젝트는 "설명만 듣는 학습"이 아니라 "스스로 예측하고, 답하고, 질문하며 이해를 깊게 만드는 학습 흐름"을 만들기 위해 시작됐습니다. 내부 PRD v2.4 기준으로 다음 목표를 구현 대상으로 삼고 있습니다.

- 긴 스크립트를 의미 단위로 분할
- 1~2번의 질문으로 출발점을 파악
- 수준별 맞춤 설명으로 핵심 개념 전달
- 자유 질문 중심의 Discuss 단계 제공
- 학습 깊이와 연결을 Knowledge Constellation으로 시각화
- 세션별 토큰/비용/요약 기록

## 프로젝트 용도

- 강의 스크립트, 노트, 정리 문서를 업로드해 파트별로 학습하고 싶은 경우
- AI 튜터보다는 "탐구 동료"에 가까운 상호작용형 학습 UX를 검증하고 싶은 경우
- 세그먼트별 이해도, 대화 요약, 연결 구조를 로컬 파일로 남기고 싶은 경우

## 현재 구현 상태

PRD와 현재 코드베이스를 비교하면 아래와 같습니다.

| 항목 | PRD 기준 | 현재 상태 |
|---|---|---|
| 학습 루프 | Preview → Probe → Deliver → Discuss | 구현됨 |
| Preview 저장 | LLM 호출 없이 예측 저장 | 구현됨 |
| Probe 질문 생성 | 세그먼트별 질문 1개 생성 | 구현됨 |
| 낮은 이해도 힌트 | L0~L1일 때 힌트 1회 | 구현됨 |
| Deliver | 레벨 기반 설명 생성 | 구현됨 |
| Discuss | 자유 질문, 세그먼트 연결 감지 | 구현됨 |
| Integration Challenge | N개 세그먼트마다 도전 질문 | 구현됨 |
| Knowledge Constellation | 노드/엣지 시각화 | 구현됨 |
| 세션 영속화 | JSON 파일 저장 | 구현됨 |
| 비용/토큰 추적 | 세션 단위 집계 | 구현됨 |
| Anthropic API 경로 | CLI 외 대체 경로 | 미구현 |
| Prompt caching / 정교한 압축 계층 | 비용 최적화 아키텍처 전체 | 일부만 반영 |
| KPI 계측 대시보드 | 학습 효과 자동 측정 | 미구현 |
| Archive Markdown 내보내기 | 아카이브 export | 구현됨 |
| 모델 설정 연결 | 엔진/모델 설정 실제 반영 | UI 프로토타입 수준 |

즉, 핵심 학습 루프와 세션 처리 흐름은 구현돼 있지만, 운영 기능과 측정/설정 계층은 아직 확장 단계입니다.

## 디렉토리 구조

```text
Academic_Architect/
├── src/                  # React 프론트엔드
│   ├── components/       # 화면 및 UI 컴포넌트
│   ├── hooks/            # 세션 상태 관리
│   ├── api.ts            # FastAPI 호출 레이어
│   └── types.ts          # 프론트 타입 정의
├── server/               # FastAPI + 학습 오케스트레이션
│   ├── prompts/          # phase별 프롬프트
│   ├── llm/              # CLI 백엔드 추상화
│   ├── main.py           # API 엔트리포인트
│   ├── orchestrator.py   # 학습 상태 머신
│   └── session_store.py  # JSON 세션 저장
├── data/                 # 업로드/세션/아카이브 데이터
├── requirements.txt      # Python 의존성
├── package.json          # Node 의존성
└── .env.example          # 환경 변수 예시
```

## 기술 스택

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Motion
- Backend: FastAPI, Pydantic Settings
- LLM 실행 경로: Claude Code CLI subprocess (`claude -p`)
- 저장 방식: 로컬 JSON 파일 기반 세션 저장

## 실행 방법

### 1. 사전 준비

아래 환경이 필요합니다.

- Node.js 18+
- Python 3.11+
- `claude` CLI 설치 및 로그인 완료

### 빠른 시작

가장 간단한 실행 방식은 아래 명령입니다.

```bash
./AA --onboard
```

이 명령은 아래 작업을 한 번에 처리합니다.

- `.env`가 없으면 `.env.example` 기준으로 생성
- `.venv`가 없으면 생성
- Python 의존성이 없으면 설치
- `node_modules`가 없으면 `npm install` 실행
- FastAPI 백엔드 실행
- Vite 프론트엔드 실행
- 브라우저에서 `http://localhost:3000` 오픈

옵션 예시:

```bash
./AA --onboard --no-browser
./AA --onboard --backend-only
./AA --onboard --frontend-only
```

### `AA --onboard`로 바로 쓰기

프로젝트 내부의 `./AA`를 사용자 명령으로 등록하려면 아래를 실행하면 됩니다.

```bash
./AA --print-install-snippet
```

출력된 내용을 실행하면 `~/.local/bin/AA` 심볼릭 링크와 `PATH` 설정이 추가됩니다. 이후에는 어느 위치에서든 아래처럼 실행할 수 있습니다.
macOS 기본 `aa` 명령과 충돌을 피하기 위해 `AA` alias도 함께 등록합니다.

```bash
AA --onboard
academic-architect --onboard
```

### 수동 설치

### 1. 프론트엔드/백엔드 의존성 설치

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

기본값은 로컬 개발 기준으로 동작합니다. 현재 실제로 동작하는 백엔드는 `LLM_BACKEND=cli` 입니다.

### 3. 백엔드 실행

```bash
source .venv/bin/activate
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 프론트엔드 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속하면 됩니다. Vite 프록시가 `/api` 요청을 `http://localhost:8000` 으로 전달합니다.

## 접속 방법

- 로컬 프론트엔드: `http://localhost:3000`
- 로컬 백엔드 헬스 체크: `http://localhost:8000/api/health`

정상 실행 시 헬스 체크 응답은 아래 형태입니다.

```json
{"status":"ok","backend":"cli"}
```

## 사용 방법

1. 첫 화면에서 시작 버튼을 누릅니다.
2. Model Settings 화면에서 설정을 적용해 대시보드로 진입합니다.
3. `.txt`, `.md`, `.srt` 파일을 업로드합니다.
4. 세그먼트별 Preview 예측을 입력하거나 건너뜁니다.
5. Probe 질문에 답하면 시스템이 이해도를 분석합니다.
6. 필요하면 힌트를 준 뒤 Deliver 단계에서 설명합니다.
7. Discuss 단계에서 자유롭게 질문하거나 `"다음"`으로 다음 세그먼트로 넘어갑니다.
8. 일정 주기마다 Integration Challenge가 나타날 수 있습니다.
9. 완료된 세션은 Archive 화면에서 요약과 깊이 정보를 다시 볼 수 있습니다.

## 데이터 저장 방식

- 업로드 파일: `data/uploads/`
- 세션 JSON: `data/sessions/`
- 아카이브 산출물: `data/archive/`

세션별로 제목, 세그먼트 상태, 대화 로그, 요약, 토큰 사용량, 비용이 JSON으로 저장됩니다.

## 현재 한계와 참고 사항

- 기본 백엔드는 Claude CLI 전용이며 API 백엔드는 아직 연결되지 않았습니다.
- `Model Settings` 화면의 엔진/모델 선택은 아직 실제 백엔드 설정에 반영되지 않습니다.
- Discuss 자동 타임아웃과 KPI 대시보드는 PRD 수준까지 구현되지 않았습니다.
- 루트 디렉토리에 있는 PRD 문서는 내부 설계 기준이며, 현재 Git 저장소에는 포함돼 있지 않습니다.

## 개발 메모

- 프론트엔드는 `src/api.ts`를 통해 백엔드와 통신합니다.
- 백엔드 핵심 상태 전이는 `server/orchestrator.py`에 있습니다.
- 세션 저장 포맷은 `server/models.py`, `server/session_store.py`를 기준으로 관리됩니다.
