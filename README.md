# 황병준 포트폴리오 (React 단일 페이지 앱)

https://hbj3809.github.io 에 게시되는 빌드 결과물입니다. Vite + TypeScript + React 로 만든 단일 페이지 앱(SPA)이고, 소스와 내용 파일은 따로 관리합니다. 이 저장소의 파일은 빌드할 때마다 통째로 바뀌므로 직접 고치지 않습니다.

- 페이지: `index.html`(홈) · `about.html`(소개) · `experience.html`(경력) · `projects.html`(직무별 프로젝트) · `projects/*.html`(프로젝트 상세: 상세 / 문제해결 두 탭) · `ai.html`(AI로 일하는 방식) · `skills.html`(기술). 주소마다 같은 앱을 띄우는 HTML 이 있어 어느 주소로 들어와도 열리고, 쪽 사이 이동은 새로 읽지 않고 앱 안에서 합니다. 없는 주소에는 `404.html` 이 뜹니다.
- 구성: `assets/index-*.js`·`*.css`(앱), `assets/page/*.js`(쪽마다 화면에 나오는 내용만 담은 데이터), `assets/vendor/*.js`(React·React Router·Mermaid 같은 라이브러리).
- 디자인: Once UI 의 Magic Portfolio 피그마 디자인을 바탕으로 했습니다. 다크·라이트 테마를 메뉴에서 바꿀 수 있습니다.
- 도표: 플로우차트·상태도·기술 스택 지도는 빌드할 때 배치를 계산해 두었고, 시퀀스·ERD 도표만 브라우저에서 Mermaid 로 그립니다(그 도표가 있는 쪽에서만 불러옵니다).
- 외부에서 불러오는 것은 글꼴뿐입니다: Inter(Google Fonts)·Pretendard(jsDelivr). 연결이 안 되면 시스템 글꼴로 바뀝니다. 앱이라 JavaScript 가 꺼져 있으면 내용이 보이지 않습니다.
- 로컬 확인: 이 폴더에서 `python -m http.server 8765 --bind 127.0.0.1` 후 http://127.0.0.1:8765
- 게시: GitHub Pages(`main` 브랜치 루트). `.nojekyll` 이 있어 파일을 그대로 서비스합니다.
- 도표·그래프는 모두 직접 그린 개념도입니다. 실제 서비스 화면이나 내부 시스템 이름은 넣지 않았습니다.

이 저장소는 공개용입니다. 회사 내부 정보·고객사 실명·개인 연락처(이메일 제외)는 넣지 않습니다.
