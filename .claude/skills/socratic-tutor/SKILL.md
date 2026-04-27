---
name: socratic-tutor
description: Launch a Socratic learning session for a study file. Boots the Academic Architect HUD and opens it in the browser, pre-scoped to the uploaded session. Use when the user wants to learn from a lecture script, notes, or markdown file via guided questions.
---

# Socratic Tutor

소크라테스식 학습 세션을 *터미널 한 줄* 로 시작합니다. 스크립트 파일을 받아서 백엔드/프론트엔드를 부팅하고, 학습 HUD를 브라우저로 열어 그 세션으로 바로 점프시킵니다.

> **정체성**: 이 도구는 *답을 주지 않고 답에 도달하게 만드는* 학습 에이전트입니다.
> 대화·시각화는 전부 HUD에서 진행됩니다. 터미널은 진입점일 뿐이며,
> 이 스킬 자체가 소크라테스식 대화를 시도해서는 안 됩니다.

## 사용

사용자가 파일 경로를 제공하면 호출됩니다. 예: `/socratic ./linear-algebra.txt`.

## 동작

1. **인자 검증** — 받은 인자를 파일 경로로 해석. 절대경로로 풀고, 파일이 존재하지 않거나 읽을 수 없으면 명확한 에러를 출력하고 중단.
2. **`AA` 런처 위치 확인** — 다음 순서로 찾는다:
   - `which AA` (사용자가 `--print-install-snippet` 으로 PATH에 등록한 경우)
   - 현재 작업 디렉토리의 `./AA`
   - 부모 디렉토리들에서 `AA` 탐색 (academic_architect 클론 안에서 실행한 경우)
   - 모두 실패하면 다음을 안내하고 중단:
     > Academic Architect 클론 필요. 다음을 실행:
     > `git clone https://github.com/relioptic/academic_architect && cd academic_architect && ./AA --print-install-snippet`
3. **백엔드/프론트엔드 부팅 + 업로드** — Bash 도구로 다음을 *백그라운드*에서 실행:
   ```bash
   <AA-path> --onboard --upload <resolved-file> --no-browser
   ```
   - `--no-browser` 를 붙여 브라우저는 직접 제어 (skill이 URL을 사용자에게 보여주는 게 더 확실).
   - 백그라운드로 띄워야 학습 세션이 끝날 때까지 사용자의 Claude Code 세션이 막히지 않음.
   - 백엔드/프론트엔드가 이미 떠 있으면 AA가 자동으로 감지해 재사용한다 — 별도 처리 불필요.
4. **세션 ID 캡처** — 출력에서 다음 형태의 줄을 찾는다:
   ```
   [AA] Session created: <id>
   ```
   AA는 *백엔드가 뜨자마자* 업로드를 수행하므로(프론트엔드 부팅을 기다리지 않음),
   대부분의 경우 5~10초 안에 이 줄이 등장한다. 보수적으로 90초까지 폴링.
5. **HUD URL 안내** — 사용자에게 다음을 보고:
   - 학습 HUD: `http://localhost:3000/?session=<id>`
   - 짧은 안내 한 줄: "브라우저에서 학습을 이어가세요. 세션이 끝나면 아카이브 화면에서 마크다운 보고서를 받을 수 있습니다."
   - 백엔드 로그를 보고 싶다면 어느 백그라운드 프로세스에 붙으면 되는지도 알려준다.

## 제약

- **HUD에서 대화하라**. 이 스킬이 터미널에서 소크라테스 루프를 흉내내려 시도하지 말 것 — 정체성 일관성이 깨진다.
- 사용자의 파일을 수정하거나 이동하지 말 것. 업로드는 복사 동작이며, 원본은 그대로 둔다.
- `AA` 런처가 이미 다른 세션을 굴리고 있다면 — 즉 8000/3000 포트가 이미 점유 중이라면 — 새로 부팅하지 말고 직접 multipart POST 를 `http://localhost:8000/api/sessions` 로 보내고 동일하게 URL 만 안내한다.

## 실패 시 대처

- **포트 점유**: 다른 도구가 8000/3000을 쓰고 있으면 안내하고 중단. 재시도하지 말 것.
- **업로드 실패**: HTTP 응답 본문을 그대로 사용자에게 노출.
- **세션 ID 미수신**: 60초 안에 `Session created:` 줄을 못 찾으면, 백엔드 로그 위치 (`AA` 출력)를 안내하고 중단.
