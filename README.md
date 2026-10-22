# 황병준 포트폴리오 (정적 웹사이트)

그대로 서비스하는 HTML/CSS/JS 입니다. 페이지는 내용 파일에서 생성한 결과물이라 이 저장소에서 HTML 을 직접 고치지 않습니다.

- 로컬 확인: `python -m http.server 8765 --bind 127.0.0.1` 후 http://127.0.0.1:8765
- 게시: GitHub Pages — Settings → Pages → Deploy from a branch → `main` / `/ (root)`
- 페이지: `index.html`(홈) · `about.html`(소개) · `experience.html`(경력) · `projects.html`(직무별 프로젝트) · `projects/*.html`(프로젝트 상세 — 상세 / 문제해결 두 탭) · `ai.html`(AI로 일하는 방식) · `skills.html`(기술)
- 디자인: Once UI 의 Magic Portfolio 피그마 디자인을 바탕으로 했습니다. 공용 스타일·스크립트는 `assets/css/site.css`, `assets/js/site.js`, 배경 그림은 `assets/img/`.
- 외부에서 불러오는 것: 글꼴 Inter(Google Fonts)·Pretendard(jsDelivr), 도표 렌더러 Mermaid 11(jsDelivr). 연결이 안 되면 시스템 글꼴로 바뀌고, 도표는 원문 텍스트로 보입니다.
- 도표·그래프는 모두 직접 그린 개념도입니다. 실제 서비스 화면이나 내부 시스템 이름은 넣지 않았습니다.

이 저장소는 공개용입니다. 회사 내부 정보·고객사 실명·개인 연락처(이메일 제외)는 넣지 않습니다.
