# Academic Architect

AI 기반 적응형 학습 에이전트. 긴 학습 자료를 세그먼트 단위로 분해하고, `Preview → Probe → Deliver → Discuss` 루프를 통해 사용자의 이해도에 맞춰 학습을 진행합니다.

React 19 + Vite 6 프론트엔드, FastAPI 백엔드, Claude CLI subprocess(`claude -p`) 기반 LLM 실행 구조로 동작합니다.

## 핵심 학습 루프

| 단계 | 동작 |
|---|---|
| **Preview** | 세그먼트 내용을 보기 전, 사용자가 예측을 작성 (LLM 호출 없음) |
| **Probe** | AI가 핵심 질문 1개를 생성하고, 사용자의 답변으로 이해도(L0~L3) 판정 |
| **Hint** | 이해도 L0~L1인 경우 힌트 1회 제공 후 재답변 기회 |
| **Deliver** | 판정된 이해도 수준에 맞는 설명 생성 |
| **Discuss** | 자유 질문/답변. 30초 무입력 시 자동 다음 세그먼트로 진행 |
| **Challenge** | N개 세그먼트마다 통합 도전 질문 출제 |

## 주요 기능

- Knowledge Constellation: 세그먼트 간 개념 연결을 노드/엣지로 시각화
- 세션 영속화: JSON 파일 기반 세션 저장/복원
- 비용/토큰 추적: 세션 단위 사용량 집계
- 비동기 업로드: 파일 업로드 즉시 응답, 백그라운드에서 세그먼트 분석
- 에러 복구: ErrorBoundary + localStorage 기반 상태 복원
- Archive: 완료된 세션의 요약, 깊이 정보 열람

## 기술 스택

| 계층 | 구성 |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (framer-motion), Lucide Icons |
| Backend | FastAPI 0.115, Pydantic Settings, python-multipart, chardet |
| LLM | Claude Code CLI subprocess (`claude -p`) |
| 저장 | 로컬 JSON 파일 (`data/sessions/`, `data/uploads/`, `data/archive/`) |

## 디렉토리 구조

```text
Academic_Architect/
├── AA                        # 원커맨드 실행 스크립트
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx       # 시작 화면
│   │   ├── ModelSettingsScreen.tsx # 모델/엔진 설정
│   │   ├── DashboardScreen.tsx    # 세션 목록 + 파일 업로드
│   │   ├── LearningScreen.tsx     # 학습 루프 메인 화면
│   │   ├── ArchiveScreen.tsx      # 완료 세션 열람
│   │   ├── ConstellationView.tsx  # 지식 그래프 시각화
│   │   ├── Layout.tsx             # 탭 네비게이션 레이아웃
│   │   ├── learning/              # 학습 화면 하위 컴포넌트
│   │   └── ui/                    # 공용 UI (Card, Badge, ErrorBoundary 등)
│   ├── hooks/useSession.ts    # useReducer 기반 세션 상태 관리
│   ├── api.ts                 # FastAPI 호출 레이어
│   └── types.ts               # 공유 타입 정의
├── server/
│   ├── main.py                # FastAPI 엔트리포인트
│   ├── orchestrator.py        # 학습 상태 머신
│   ├── models.py              # Pydantic 모델
│   ├── session_store.py       # JSON 세션 저장
│   ├── cost_tracker.py        # 토큰/비용 집계
│   ├── script_loader.py       # 스크립트 파싱
│   ├── config.py              # 환경 설정
│   ├── prompts/               # phase별 프롬프트 (segment, probe, deliver, discuss, challenge, compress, archive)
│   └── llm/
│       ├── base.py            # LLM 백엔드 인터페이스
│       └── cli_backend.py     # Claude CLI 구현체
├── data/                      # 런타임 데이터 (gitignored)
├── scripts/ralph/             # Ralph 자율 에이전트 루프
├── requirements.txt
├── package.json
└── .env.example
```

## 실행 방법

### 사전 요구 사항

- Node.js 18+
- Python 3.11+
- `claude` CLI 설치 및 로그인 완료

### 빠른 시작

```bash
./AA --onboard
```

이 명령 하나로 의존성 설치, 환경 설정, 백엔드/프론트엔드 실행, 브라우저 열기까지 처리됩니다.

```bash
./AA --onboard --no-browser      # 브라우저 자동 열기 생략
./AA --onboard --backend-only    # 백엔드만 실행
./AA --onboard --frontend-only   # 프론트엔드만 실행
```

### 글로벌 명령 등록

```bash
./AA --print-install-snippet
```

출력된 스크립트를 실행하면 `AA` / `academic-architect` 명령이 어디서든 사용 가능해집니다.

### 수동 설치

```bash
# 의존성
npm install
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 환경 변수
cp .env.example .env

# 백엔드 (포트 8000)
source .venv/bin/activate
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

# 프론트엔드 (포트 3000, 별도 터미널)
npm run dev
```

`http://localhost:3000` 접속. Vite 프록시가 `/api` 요청을 `localhost:8000`으로 전달합니다.

## 사용 방법

1. 시작 화면에서 진입
2. Model Settings에서 설정 적용 후 대시보드 진입
3. `.txt`, `.md`, `.srt` 파일 업로드 (비동기 처리, 즉시 응답)
4. 세그먼트별 Preview → Probe → Deliver → Discuss 순서로 학습 진행
5. Discuss에서 자유 질문하거나 30초 대기 시 자동 다음 세그먼트
6. 일정 주기마다 Integration Challenge 출제
7. 완료 세션은 Archive에서 요약/깊이 정보 열람

## 헬스 체크

```bash
curl http://localhost:8000/api/health
# {"status":"ok","backend":"cli"}
```

## 현재 한계

- LLM 백엔드는 Claude CLI 전용. Anthropic API 직접 연결은 미구현
- Model Settings의 엔진/모델 선택이 실제 백엔드에 반영되지 않음
- Archive Markdown export 미구현
- KPI 계측 대시보드 미구현
- Prompt caching / 압축 계층은 일부만 반영

## 개발 참고

- 프론트엔드 API 호출: `src/api.ts`
- 학습 상태 머신: `server/orchestrator.py`
- 세션 모델: `server/models.py` + `server/session_store.py`
- 프론트엔드 세션 상태: `src/hooks/useSession.ts` (useReducer 패턴)
- 앱 상태 복원: `App.tsx`에서 localStorage로 activeTab/activeSessionId 영속화
