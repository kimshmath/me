# Claude Code Quick Start Prompts

이 파일은 **Claude Code**를 실행한 후 터미널에 바로 복사하여 붙여넣을 수 있는 작업별 프롬프트 모음집입니다.

---

## 1. 신규 논문 / 출판 실적 추가

```text
[프롬프트 복사]
새로운 논문을 웹사이트와 CV에 추가해줘.

1. 논문 정보:
- 제목: [논문 제목 입력]
- 저자: [저자1, 저자2, ...]
- 상태: Submitted (또는 Published, 저널명: ..., 권/호/페이지: ...)
- arXiv: https://arxiv.org/abs/26XX.XXXXX
- Journal DOI: (있는 경우 URL 입력)
- PDF 링크: (있는 경우 입력)
- Abstract: [초록 내용 입력]

2. 수행할 작업:
- research.html의 해당 섹션(Preprints / Published)에 양식에 맞춰 추가
- cv.tex의 Publications 섹션에 추가
- xelatex cv.tex 명령어로 cv.pdf를 다시 컴파일
- 결과를 요약해줘.
```

---

## 2. 세미나 / 학회 발표(Talk) 추가

```text
[프롬프트 복사]
새로운 강연/발표 일정을 추가해줘.

1. 강연 정보:
- 행사명: [세미나 또는 컨퍼런스 명]
- 장소: [기관명, 도시, 국가]
- 날짜: 2026년 X월 X일 (또는 2026-XX-XX)
- 비고: (초청강연, 기조강연 등 특이사항)

2. 수행할 작업:
- research.html의 Upcoming Talks 목록에 data-date 속성과 함께 추가
- cv.tex의 Talks 목록 최상단에 추가
- xelatex cv.tex 로 cv.pdf 컴파일
```

---

## 3. CV 내용 수정 및 단독 재컴파일

```text
[프롬프트 복사]
cv.tex를 다음과 같이 수정하고 cv.pdf로 다시 컴파일해줘.

[수정 요청 내용 작성]
(예: Academic Positions 항목에 ... 추가)

수정 후 `xelatex -interaction=nonstopmode cv.tex`를 실행해서 오류 없이 컴파일되는지 확인해줘.
```

---

## 4. 웹사이트 스타일 / 디자인 미세 조정

```text
[프롬프트 복사]
css/styles.css 및 웹페이지 디자인을 수정하고 싶어.
- 수정 사항: [예: 모바일 화면에서 내비게이션 바 패딩 축소, 또는 카드 호버 효과 부드럽게 조정]
- 수정 후 로컬 서버(python3 -m http.server 8000)를 실행해서 결과를 확인할 수 있는 로컬 링크를 알려줘.
```

---

## 5. 저장소 변경사항 최종 확인 및 GitHub 배포

```text
[프롬프트 복사]
지금까지 수정한 모든 파일(웹페이지, cv.tex, cv.pdf)의 git status 및 git diff를 확인하고,
변경 내용을 간결하고 명확한 커밋 메시지로 작성해서 main 브랜치에 커밋 및 푸시해줘.
```

---

## 6. 새로운 페이지 추가 또는 대규모 개편

```text
[프롬프트 복사]
새로운 페이지 [페이지이름.html]을 추가하려고 해.
- 목적/내용: [페이지 설명]
- 기존 index.html, research.html과 동일한 헤더, 내비게이션, 푸터, 다크 테마 디자인을 유지해줘.
- 모든 기존 html 파일의 내비게이션 바에도 새로운 페이지 링크를 추가해줘.
```
