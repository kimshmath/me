# Claude Code 인수인계 및 운영 가이드 (Handoff & Operations Manual)

본 문서는 **김상현 교수님 개인 웹사이트 ([kimsh.kr](https://kimsh.kr) / [me.kimsh.kr](https://me.kimsh.kr)) 및 Academic CV (`cv.tex`, `cv.pdf`)** 관리 작업을 **Claude Code**로 완전하게 전환하고 원활하게 이어서 작업할 수 있도록 작성된 종합 인수인계 문서입니다.

---

## 1. 개요 및 인수인계 핵심 요약

- **작업 대상**: 개인 홈페이지 (HTML/CSS/JS) 및 LaTeX 학술 이력서 (`cv.tex` / `cv.pdf`)
- **저장소 위치**: `/Users/kimsh/Documents/antigravity/kimsh-kr`
- **GitHub 저장소**: `https://github.com/kimshmath/me` (`main` 브랜치)
- **도메인 연결**: `me.kimsh.kr` (CNAME), `kimsh.kr`
- **새로운 작업 도구**: **Claude Code CLI** (`claude`)

---

## 2. 교수님께서 진행하실 초기 설정 (Prerequisites)

Claude Code를 사용하기 위해 다음 3단계만 확인/진행해 주시면 됩니다.

### Step 1. Node.js & Claude Code CLI 설치
터미널(Terminal 또는 iTerm)을 열고 Claude Code가 설치되어 있는지 확인합니다:
```bash
claude --version
```
설치되어 있지 않다면 아래 명령어로 글로벌 설치합니다:
```bash
npm install -g @anthropic-ai/claude-code
```

### Step 2. 로그인 및 인증
터미널에서 인증을 진행합니다:
```bash
claude
# 브라우저가 열리면 Anthropic 계정으로 로그인 또는 API 키를 입력합니다.
```

### Step 3. XeLaTeX 컴파일 환경 확인
LaTeX 이력서(`cv.tex`)를 PDF로 즉시 빌드하기 위해 MacTeX(XeLaTeX)이 정상 작동하는지 확인합니다:
```bash
xelatex --version
```
*(현재 시스템의 `/Library/TeX/texbin/xelatex`가 정상 설정되어 있습니다.)*

---

## 3. Claude Code 실행 및 일상 작업 워크플로우

### 기본 실행 방법
터미널에서 웹사이트 프로젝트 폴더로 이동한 후 `claude`를 실행합니다:
```bash
cd /Users/kimsh/Documents/antigravity/kimsh-kr
claude
```
> **참고**: Claude Code는 실행 시 프로젝트 루트의 [`CLAUDE.md`](file:///Users/kimsh/Documents/antigravity/kimsh-kr/CLAUDE.md) 파일을 자동으로 읽고 프로젝트의 구조, 스타일 규칙, 컴파일 명령어, 동기화 규칙을 숙지한 상태로 시작합니다.

---

## 4. 자주 사용하는 작업별 프롬프트 예시 (Copy & Paste)

### ① 신규 논문 / 프리프린트 추가
> **프롬프트 예시**:
> ```text
> 새로운 논문을 추가해줘.
> - 제목: [논문 제목]
> - 저자: [저자 목록]
> - 구분: Submitted (또는 Published, 저널명: ...)
> - arXiv 번호: [XXXX.XXXXX]
> - 초록: [Abstract 내용]
> 
> research.html과 cv.tex 양쪽에 모두 추가하고, cv.tex는 xelatex으로 컴파일해서 cv.pdf까지 최신화해줘.
> ```

### ② 세미나 / 학회 발표(Talk) 일정 추가
> **프롬프트 예시**:
> ```text
> 2026년 예정된 세미나 일정을 추가해줘:
> - 학회/세미나명: [행사명]
> - 장소/기관: [기관 및 도시]
> - 일자: 2026년 X월 X일
> 
> research.html의 Upcoming Talks와 cv.tex의 Talks 목록 맨 위에 추가하고 cv.pdf를 다시 컴파일해줘.
> ```

### ③ CV 내용 수정 및 PDF 재빌드
> **프롬프트 예시**:
> ```text
> cv.tex에서 Academic Positions의 직책 정보를 [수정할 내용]으로 변경하고, xelatex으로 빌드해서 cv.pdf를 업데이트해줘.
> ```

### ④ 로컬 웹사이트 미리보기 확인
> **프롬프트 예시**:
> ```text
> 수정된 웹사이트를 브라우저에서 미리볼 수 있도록 로컬 서버를 띄워줘.
> ```
*(Claude가 `python3 -m http.server 8000`을 실행하고 링크를 안내합니다.)*

### ⑤ 변경사항 커밋 및 GitHub 배포
> **프롬프트 예시**:
> ```text
> 지금까지 수정한 변경사항(웹페이지와 cv.pdf 포함)을 git status로 확인하고, 적절한 커밋 메시지를 작성해서 main 브랜치에 푸시(push)해줘.
> ```

---

## 5. 핵심 동기화 및 관리 규칙

1. **`cv.tex`와 `research.html`의 일치 (Strict Synchronization)**:
   - 논문 출판, 프리프린트 등록, 학회 발표 추가 시 항상 **두 파일을 함께 수정**해야 정보 불일치가 발생하지 않습니다.
2. **LaTeX 수식 및 특수문자 표기**:
   - `cv.tex` 내 수학 기호(예: $S^1$, $\mathbb{R}$)는 반드시 달러 기호(`$...$`)로 감싸야 합니다.
   - 특수문자는 `\&`, `\%`, `\_` 등으로 이스케이프합니다.
3. **웹페이지 디자인 일관성**:
   - 다크 테마 기반 (`#0a0d14`), 세리프 제목 (`Newsreader`), 깔끔한 본문 (`Inter`).
   - 반응형 디자인(모바일 화면)이 깨지지 않도록 `<div class="card">`와 `<ul class="paper-list">` 구조를 유지합니다.
4. **온라인 인라인 편집 모드 (Edit Mode)**:
   - 웹사이트 우하단 로그인 버튼을 통해 브라우저에서 직접 카드를 추가/수정하면 GitHub API로 자동 커밋됩니다 (`js/edit-mode.js`).
   - Claude Code로 수동 편집할 때도 기존 클래스명/ID 체계를 그대로 유지해야 이 기능이 정상 동작합니다.

---

## 6. 트러블슈팅 및 문제 해결

| 증상 | 원인 | 해결 방법 |
| :--- | :--- | :--- |
| **`cv.pdf` 컴파일 에러** | 한글 유니코드 또는 수식 기호 누락 | `xelatex cv.tex` 명령으로 에러 라인을 확인하거나, Claude Code에게 `cv.tex 컴파일 에러를 고쳐줘`라고 요청 |
| **웹페이지 변경이 실시간 반영 안 됨** | 브라우저 캐시 | 브라우저에서 강력 새로고침(`Cmd + Shift + R`)을 누릅니다 |
| **GitHub Push 권한 에러** | 로컬 git 인증 만료 | `git push` 시 SSH 키 또는 GitHub Personal Access Token (PAT) 설정 확인 |
| **포트 충돌 (`Port already in use`)** | 이전 http.server 실행 중 | `killall Python` 또는 다른 포트 사용 (`python3 -m http.server 8080`) |
