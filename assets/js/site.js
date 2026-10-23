// 황병준 포트폴리오 — 테마(다크·라이트), 나타나기 움직임, 탭(상세·문제해결), 직무 필터, 카드 기울임, 도표(Mermaid) 늦은 렌더링, 차트 말풍선.
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function theme() { return root.getAttribute("data-theme") === "light" ? "light" : "dark"; }
  // 테마 토큰 값 읽기(site.css :root[data-theme] 의 --mm-* 등). Mermaid 는 var() 를 못 읽어 값으로 넘긴다
  function token(name) { return window.getComputedStyle(root).getPropertyValue(name).trim(); }

  // ---- Mermaid: 보이는 패널의 도표만 그린다(숨은 패널에서 그리면 크기가 0 으로 계산됨) ----
  // 색은 지금 테마의 토큰(--mm-*)에서 만든다. 테마를 바꾸면 설정을 다시 넣고 그린 도표를 다시 그린다(rerenderMermaid)
  var mermaidReady = false;
  var mermaidTheme = "";
  function mermaidConfig() {
    var c = {
      node: token("--mm-node"), node2: token("--mm-node-2"), node3: token("--mm-node-3"), act: token("--mm-act"),
      ink: token("--mm-ink"), title: token("--mm-title"), line: token("--mm-line"), line2: token("--mm-line-2"),
      signal: token("--mm-signal"), border: token("--mm-border"), border2: token("--mm-border-2"),
      cluster: token("--mm-cluster"), pane: token("--mm-pane"), fill: token("--fill")
    };
    // 스타일시트를 못 읽었으면(토큰 없음) Mermaid 기본 테마로 그린다
    if (!c.node || !c.ink) return { startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true, theme: theme() === "light" ? "default" : "dark" };
    return {
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: "base",
      fontFamily: '"Inter","Pretendard Variable",Pretendard,"Malgun Gothic",sans-serif',
      themeVariables: {
        darkMode: theme() === "dark",
        background: "transparent",
        fontSize: "17px",
        primaryColor: c.node,
        primaryTextColor: c.ink,
        primaryBorderColor: c.border,
        secondaryColor: c.node2,
        secondaryTextColor: c.ink,
        secondaryBorderColor: c.border2,
        tertiaryColor: c.node3,
        tertiaryTextColor: c.ink,
        tertiaryBorderColor: c.line2,
        lineColor: c.line,
        textColor: c.ink,
        mainBkg: c.node,
        nodeBorder: c.border,
        clusterBkg: c.fill,
        clusterBorder: c.cluster,
        titleColor: c.title,
        edgeLabelBackground: c.pane,
        actorBkg: c.node,
        actorBorder: c.border,
        actorTextColor: c.ink,
        actorLineColor: c.line2,
        signalColor: c.signal,
        signalTextColor: c.ink,
        labelBoxBkgColor: c.node,
        labelBoxBorderColor: c.border,
        labelTextColor: c.ink,
        loopTextColor: c.ink,
        noteBkgColor: c.node2,
        noteTextColor: c.ink,
        noteBorderColor: c.border2,
        activationBkgColor: c.act,
        activationBorderColor: c.border,
        sequenceNumberColor: c.pane,
        attributeBackgroundColorOdd: c.node3,
        attributeBackgroundColorEven: c.node,
        transitionColor: c.line,
        transitionLabelColor: c.ink,
        stateLabelColor: c.ink,
        stateBkg: c.node,
        compositeBackground: c.node3,
        compositeTitleBackground: c.node2,
        altBackground: c.node3
      },
      // 머리 글(묶음 제목·alt/loop 이름표·엔터티 이름)과 내용 사이를 넉넉하게: 묶음 제목 위아래 여백, 시퀀스 상자 여백, ERD 칸 여백을 늘렸다
      // 시퀀스 메시지 글 뒤에 판 색 테두리를 둘러 세로 생명선이 글을 가로지르지 않게, ERD 관계 이름 바탕을 판 색으로 막아 끝 기호가 글자를 가리지 않게
      themeCSS: ".node rect, .node polygon { rx: 12px; ry: 12px; } .cluster rect { rx: 18px; ry: 18px; } .cluster-label { font-weight: 600; } .edgeLabel { font-size: 14px; } .er.entityBox { rx: 10px; ry: 10px; } .er.entityLabel { font-weight: 600; } .loopText, .loopText > tspan { font-weight: 600; } .labelText, .labelText > tspan { font-weight: 600; } .messageText { paint-order: stroke; stroke: " + c.pane + "; stroke-width: 6px; stroke-linejoin: round; } .relationshipLabelBox { fill: " + c.pane + " !important; opacity: 1 !important; }",
      flowchart: { htmlLabels: true, curve: "basis", padding: 18, nodeSpacing: 48, rankSpacing: 60, useMaxWidth: true, subGraphTitleMargin: { top: 14, bottom: 22 } },
      // 참가자 사이(actorMargin)를 44 → 28 로 좁혀 원래 폭을 줄인다: 넓은 화면 판(약 1078px)에 줄이지 않고 들어가는 시퀀스가 늘어 글이 작아지지 않는다
      sequence: { mirrorActors: false, actorMargin: 28, messageMargin: 44, boxMargin: 18, boxTextMargin: 12, noteMargin: 16, labelBoxHeight: 26, diagramMarginY: 16 },
      // ERD: 글 16px. 표 사이를 넓혀(diagramPadding·nodeSpacing·rankSpacing) 관계 이름이 표 테두리·칸에 붙지 않게
      er: { layoutDirection: "LR", fontSize: 16, minEntityWidth: 140, entityPadding: 24, diagramPadding: 32, nodeSpacing: 70, rankSpacing: 90 }
    };
  }
  function initMermaid() {
    if (!window.mermaid) return false;
    if (mermaidReady && mermaidTheme === theme()) return true;
    window.mermaid.initialize(mermaidConfig());
    mermaidTheme = theme();
    mermaidReady = true;
    return true;
  }
  // Mermaid 가 window load 때 스스로 기본(밝은) 테마로 그리지 않게, 스크립트가 시작하자마자 설정한다
  // (문제해결 탭 주소로 열면 보이는 도표가 없어 설정이 늦어지던 경합 — 숨은 상세 탭 도표가 기본 테마로 그려지거나 원문이 남았다)
  if (window.mermaid) initMermaid();
  // Mermaid 늦게 싣기: 쪽에 남은 Mermaid 도표가 있을 때만(build.js 가 이 스크립트에 data-mermaid 주소를 단다).
  // 예전에는 CDN 스크립트(defer)를 이 스크립트 앞에 두어 CDN 이 늦으면 테마·탭·나타나기까지 함께 멈췄다.
  // 실리자마자(onload) 자동 그리기를 끄고(startOnLoad:false) 우리 설정으로 보이는 도표를 그린다
  var MERMAID_URL = (document.currentScript && document.currentScript.getAttribute("data-mermaid")) || "";
  var mermaidLoading = false;
  function loadMermaid() {
    if (window.mermaid || mermaidLoading || !MERMAID_URL || !document.querySelector(".mermaid")) return;
    mermaidLoading = true;
    var s = document.createElement("script");
    s.src = MERMAID_URL;
    s.async = true;
    s.onload = function () {
      try { window.mermaid.initialize({ startOnLoad: false }); } catch (e) { /* 아래 initMermaid 가 다시 설정한다 */ }
      mermaidReady = false;
      renderDiagrams(document);
    };
    s.onerror = function () { mermaidLoading = false; MERMAID_URL = ""; renderDiagrams(document); };
    document.head.appendChild(s);
  }

  // 도표 아이디는 페이지 전체에서 늘어나는 순번으로 준다. mermaid.run 은 아이디를 시각(Date.now)으로 만들어
  // 같은 1ms 안에 그린 도표(헤드리스 가상 시간에서는 전부)가 같은 아이디를 받아 한곳에 겹친다.
  var diagramSeq = 0;
  var diagramChain = Promise.resolve();

  // 글꼴(Inter·Pretendard)이 다 내려온 뒤에 그려야 상자 크기를 맞게 재서 글자가 잘리지 않는다.
  // document.fonts.ready 는 이미 요청된 글꼴만 기다리므로, 도표 글자에 필요한 글꼴 조각을 직접 불러 기다린다(최대 4초).
  function fontsFor(text) {
    var fonts = document.fonts;
    if (!fonts || !fonts.load) return Promise.resolve();
    var sample = String(text || "").replace(/\s+/g, " ").slice(0, 3000) || "가A";
    var jobs = ["17px Inter", '17px "Pretendard Variable"'].map(function (f) {
      return fonts.load(f, sample).catch(function () {});
    });
    var wait = Promise.all([fonts.ready].concat(jobs));
    var limit = new Promise(function (resolve) { setTimeout(resolve, 4000); });
    return Promise.race([wait, limit]);
  }

  // ---- 판 안에서 옆으로 넘기는 도표: 판 위 안내 + 오른쪽 흐림 + 처음 위치 ----
  var HINT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4L18.58 13H3a1 1 0 1 1 0-2h15.58l-4.3-4.3a1 1 0 0 1 0-1.4z"/></svg>';
  // 양방향 화살표: 처음 위치가 가운데라 왼쪽에도 가려진 내용이 있을 때
  var HINT_ICON2 = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.7 6.3a1 1 0 0 1 0 1.4L4.42 11h15.16l-3.29-3.3a1 1 0 1 1 1.42-1.4l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.42-1.4l3.3-3.3H4.41l3.3 3.3a1 1 0 0 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.42 0z"/></svg>';
  function scrollEdges(el) {
    var max = el.scrollWidth - el.clientWidth;
    el.classList.toggle("is-end", el.scrollLeft >= max - 2);
    el.classList.toggle("is-start-off", el.scrollLeft > 2);
  }
  // over=true 면 안내(판 위)와 흐림을 붙이고 startX(그림 안 x, px)가 가운데 오게 처음 위치를 잡는다. false 면 떼어 낸다.
  // 처음 위치가 왼쪽 끝이 아니면(왼쪽에도 가려진 내용) 안내를 양방향 화살표 + '좌우로 밀어 전체 보기' 로 바꾼다
  function markScroll(el, over, startX) {
    var prev = el.previousElementSibling;
    var hasHint = prev && prev.classList && prev.classList.contains("scroll-hint");
    if (!over) {
      if (hasHint) prev.parentNode.removeChild(prev);
      el.classList.remove("is-scrollx", "is-end", "is-start-off");
      return;
    }
    var hint = hasHint ? prev : null;
    if (!hint) {
      hint = document.createElement("p");
      hint.className = "scroll-hint";
      hint.setAttribute("aria-hidden", "true");
      el.parentNode.insertBefore(hint, el);
    }
    el.classList.add("is-scrollx");
    el.setAttribute("tabindex", "0");
    if (!el.hasAttribute("data-scroll-bound")) {
      el.setAttribute("data-scroll-bound", "");
      el.addEventListener("scroll", function () { scrollEdges(el); }, { passive: true });
    }
    if (!el.hasAttribute("data-scrolled") && startX != null) {
      el.scrollLeft = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, startX - el.clientWidth / 2));
      el.setAttribute("data-scrolled", "");
    }
    var both = el.scrollLeft > 2;
    var want = both ? "both" : "right";
    if (hint.getAttribute("data-dir") !== want) {
      hint.setAttribute("data-dir", want);
      hint.innerHTML = both ? HINT_ICON2 + "<span>좌우로 밀어 전체 보기</span>" : HINT_ICON + "<span>옆으로 밀어 전체 보기</span>";
    }
    scrollEdges(el);
  }
  // 옆으로 넘기는 버튼 줄(좁은 화면 탭 막대·직무 필터): 넘칠 때만 끝 흐림(is-scrollx·is-end·is-start-off, 안내 글은 없음)
  function markEdges(el) {
    if (!el || el.offsetParent === null) return;
    var over = el.scrollWidth > el.clientWidth + 1;
    el.classList.toggle("is-scrollx", over);
    if (!over) { el.classList.remove("is-end", "is-start-off"); return; }
    if (!el.hasAttribute("data-scroll-bound")) {
      el.setAttribute("data-scroll-bound", "");
      el.addEventListener("scroll", function () { scrollEdges(el); }, { passive: true });
    }
    scrollEdges(el);
  }
  function markControls() {
    document.querySelectorAll(".controls--filter, .controls[role=\"tablist\"]").forEach(markEdges);
  }
  // 판의 실제 안쪽 폭(좌우 padding 을 뺀 값)
  function innerWidth(el) {
    var cs = window.getComputedStyle(el);
    return el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
  }

  // 남은 Mermaid(시퀀스·ERD): 판 폭에 맞춰 줄여도 글이 작아지지 않을 만큼만 줄인다.
  //   줄이는 하한: ERD 0.95(속성 글이 원래 작다), 시퀀스·그 밖 0.875(글 약 14px). 좁은 화면(899px 이하)은 0.9.
  //   그보다 넓으면 그 하한 배율로 두고 판 안에서 옆으로 넘긴다(안내 + 흐림). 처음 위치는 시퀀스·ERD 모두 왼쪽 끝 —
  //   시퀀스는 첫 참가자부터 왼쪽→오른쪽으로 읽고, ERD 는 가운데부터 보이면 왼쪽 표 이름 앞글자가 잘렸다
  function diagramKind(svg) {
    var r = (svg.getAttribute("aria-roledescription") || "").toLowerCase();
    return /sequence/.test(r) ? "seq" : /^er/.test(r) ? "er" : "other";
  }
  function fitDiagram(n) {
    var svg = n.querySelector("svg");
    var media = n.parentElement;
    if (!svg || !media) return;
    var natural = parseFloat(n.getAttribute("data-nw")) || parseFloat(svg.style.maxWidth) || (svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.width : 0);
    if (!natural) return;
    n.setAttribute("data-nw", String(natural));
    var box = innerWidth(media);
    if (!box) return;
    var kind = diagramKind(svg);
    var wide = window.matchMedia("(min-width: 900px)").matches;
    var minScale = !wide ? 0.9 : kind === "er" ? 0.95 : 0.875;
    if (natural <= box || box / natural >= minScale) {
      svg.style.maxWidth = "100%";
      svg.style.width = Math.min(natural, box) + "px";
      n.style.justifyContent = "";
      media.removeAttribute("aria-label");
      markScroll(media, false);
      return;
    }
    svg.style.maxWidth = "none";
    svg.style.width = Math.round(natural * minScale) + "px";
    n.style.justifyContent = "flex-start";
    media.setAttribute("aria-label", "넓은 도표, 옆으로 넘겨 보세요");
    markScroll(media, true, kind === "other" ? media.scrollWidth / 2 : 0);
  }
  // 시퀀스 메시지 글 뒤에 판 색 상자를 깐다: 글 둘레 테두리(paint-order)는 낱말 사이 빈칸을 못 덮어 세로 생명선이 '성공|기록' 처럼 지나갔다
  function backMessages(n) {
    var svg = n.querySelector("svg");
    if (!svg || diagramKind(svg) !== "seq") return;
    svg.querySelectorAll("text.messageText").forEach(function (t) {
      if (t.previousElementSibling && t.previousElementSibling.classList.contains("mm-msgbg")) return;
      var b;
      try { b = t.getBBox(); } catch (e) { return; }
      if (!b || !b.width) return;
      var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("class", "mm-msgbg");
      r.setAttribute("x", String(b.x - 4));
      r.setAttribute("y", String(b.y - 2));
      r.setAttribute("width", String(b.width + 8));
      r.setAttribute("height", String(b.height + 4));
      r.setAttribute("rx", "4");
      t.parentNode.insertBefore(r, t);
    });
  }
  function refitDiagrams() {
    document.querySelectorAll(".mermaid[data-nw]").forEach(function (n) { if (n.offsetParent !== null) fitDiagram(n); });
  }

  // 플로우차트 부품(정적 HTML)의 넓은 그래프: 판 폭에 맞춰 줄여도 글자가 읽히면(넓은 화면 0.85배, 좁은 화면 0.88배 이상 — 상자 글 14px 이상)
  // 줄여서 판에 맞추고, 더 넓으면 판 안에서 옆으로 넘긴다(넓은 화면 0.85배, 좁은 화면 0.94배 — 상자 글 15px·화살표 글 13px, flow.js PHONE.scale 과 같은 값).
  // 예전 좁은 화면은 0.7배까지 줄여 상자 글이 11px 대였다. 스크립트가 없으면 flow.css 의 고정 규칙(zoom)을 그대로 쓴다.
  var PHONE_ZOOM = 0.94;
  function fitFlows(root) {
    var wide = window.matchMedia("(min-width: 900px)").matches;
    var minScale = wide ? 0.85 : 0.88;
    (root || document).querySelectorAll(".flow__scroll").forEach(function (sc) {
      if (sc.offsetParent === null) return;
      var cv = sc.querySelector(".flow__canvas");
      if (!cv) return;
      var w = parseFloat(cv.style.width);
      var avail = sc.clientWidth;
      if (!w || !avail) return;
      var s = avail >= w ? 1 : avail / w;
      var over = false;
      if (s < minScale) { s = wide ? minScale : PHONE_ZOOM; over = w * s > avail + 1; }
      s = Math.floor(s * 1000) / 1000;
      cv.style.zoom = String(s);
      var sx = parseFloat(cv.getAttribute("data-start-x"));
      markScroll(sc, over, isNaN(sx) ? 0 : sx * s);
    });
  }

  // ERD 가 판보다 많이 넓으면(1.2배 넘음) 위→아래(TB) 배치로 한 번 더 그려 보고, 판에 덜 넘치는 쪽을 쓴다(가로로 길게 늘어선 ERD 는
  // 넓은 화면에서도 옆으로 넘기며 양 끝 표가 잘렸다). 방향은 원문 앞에 그 도표만의 설정 줄(%%{init}%%)을 붙여 바꾼다
  var ER_TB = '%%{init: {"er": {"layoutDirection": "TB"}}}%%\n';
  function svgWidth(html) {
    var m = /max-width:\s*([\d.]+)px/.exec(html) || /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) /.exec(html);
    return m ? parseFloat(m[1]) : 0;
  }
  function svgHeight(html) {
    var m = /viewBox="[-\d.]+ [-\d.]+ [\d.]+ ([\d.]+)"/.exec(html);
    return m ? parseFloat(m[1]) : 0;
  }
  function renderOne(n) {
    var src = n.getAttribute("data-src") || n.textContent;
    var id = "mmd-" + (++diagramSeq);
    var box = innerWidth(n.parentElement) || 0;
    return fontsFor(src).then(function () {
      n.setAttribute("data-processed", "true");
      return window.mermaid.render(id, src, n);
    }).then(function (res) {
      var w = svgWidth(res.svg);
      if (!/^\s*erDiagram/.test(src) || !box || w <= box * 1.2) return res;
      var id2 = "mmd-" + (++diagramSeq);
      return window.mermaid.render(id2, ER_TB + src, n).then(function (res2) {
        var w2 = svgWidth(res2.svg), h = svgHeight(res.svg), h2 = svgHeight(res2.svg);
        var s1 = Math.min(1, box / w), s2 = Math.min(1, box / (w2 || Infinity));
        // TB 가 판에 확실히 덜 넘치고(배율 15% 이상 나음) 지나치게 길지 않을 때(높이 3배 안)만
        return s2 >= s1 * 1.15 && (!h || !h2 || h2 <= h * 3) ? res2 : res;
      }, function () { return res; });
    }).then(function (res) {
      n.innerHTML = res.svg;
      if (res.bindFunctions) res.bindFunctions(n);
      n.removeAttribute("data-nw");
      fitDiagram(n);
      backMessages(n);
    }).catch(function () {
      // 문법 오류 등으로 못 그리면 원문을 그대로 보여 준다
      var tmp = document.getElementById("d" + id);
      if (tmp && tmp.parentNode) tmp.parentNode.removeChild(tmp);
      n.classList.add("mermaid--error");
      n.setAttribute("data-processed", "error");
      n.textContent = src;
    });
  }

  function renderDiagrams(root) {
    // 안전망: 이 스크립트가 아닌 Mermaid 자동 그리기가 먼저 손댄 도표(data-processed 는 있는데 우리 줄에 오른 적 없음)는
    // 기본 테마로 그려졌거나 원문이 남은 것이라 지우고 다시 그린다. 테마가 바뀌어 다시 그릴 도표(stale)는 그림을 둔 채 그 위에 다시 그린다
    (root || document).querySelectorAll(".mermaid[data-processed]:not([data-queued])").forEach(function (n) {
      var st = n.getAttribute("data-processed");
      if (st === "fallback" || st === "stale") return;
      n.removeAttribute("data-processed");
      n.classList.remove("mermaid--error");
      n.textContent = n.getAttribute("data-src") || n.textContent;
    });
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll('.mermaid:not([data-processed]), .mermaid[data-processed="stale"]'));
    nodes = nodes.filter(function (n) { return n.offsetParent !== null && !n.hasAttribute("data-queued"); });
    if (!nodes.length) return;
    if (!window.mermaid && MERMAID_URL) {
      // 아직 안 실었으면 싣고, 실린 뒤(onload) 다시 부른다
      loadMermaid();
      return;
    }
    if (!initMermaid()) {
      // CDN 을 못 불러오면 원문을 그대로 보여 준다
      nodes.forEach(function (n) { n.classList.add("mermaid--error"); n.setAttribute("data-processed", "fallback"); });
      return;
    }
    nodes.forEach(function (n) { n.setAttribute("data-queued", ""); });
    // 도표마다 차례로 그린다(한꺼번에 그리지 않는다). 탭을 오가며 나중에 부른 것도 같은 줄 뒤에 붙는다.
    nodes.forEach(function (n) {
      diagramChain = diagramChain.then(function () { return renderOne(n); });
    });
  }
  // 테마가 바뀌면: 지금까지 그린 도표를 '다시 그릴 것(stale)'으로 표시하고(그림은 바뀔 때까지 그대로), 설정을 새 테마로 넣은 뒤
  // 보이는 패널의 것부터 다시 그린다. 숨은 패널의 것은 탭을 열 때 그린다(select → renderDiagrams)
  function rerenderMermaid() {
    if (!window.mermaid || !mermaidReady) return;
    diagramChain = diagramChain.then(function () {
      initMermaid();
      document.querySelectorAll('.mermaid[data-processed="true"]').forEach(function (n) {
        n.setAttribute("data-processed", "stale");
        n.removeAttribute("data-queued");
      });
    }).then(function () { renderDiagrams(document); });
  }

  // ---- 탭 (상세 / 문제해결) ----
  function setupTabs() {
    var tabs = document.querySelectorAll('[role="tab"][data-panel]');
    if (!tabs.length) return;
    function select(id, push) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-panel") === id;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (push) history.replaceState(null, "", id === "detail" ? location.pathname : "#" + id);
      root.classList.remove("start-problems"); // 머리 스크립트가 붙인 '처음부터 문제해결 탭' 표시: 이제 탭이 정했다
      var panel = document.getElementById("panel-" + id);
      requestAnimationFrame(function () { fitFlows(panel); renderDiagrams(panel); refitDiagrams(); markChartScroll(); markControls(); });
    }
    // 주소의 # 가 가리키는 탭: '#problems' 이거나, 그 아이디의 요소(예: 사례 바로가기 '#case-3')가 문제해결 패널 안에 있으면 문제해결
    function panelOfHash() {
      var h = decodeURIComponent((location.hash || "").replace("#", ""));
      if (!h) return { id: "detail", el: null };
      if (h === "problems") return { id: "problems", el: null };
      var el = document.getElementById(h);
      var pp = document.getElementById("panel-problems");
      return { id: el && pp && pp.contains(el) ? "problems" : "detail", el: el };
    }
    // 해시가 가리키는 요소로 간다(숨은 패널에 있던 사례는 탭을 연 뒤에야 자리가 생긴다). scroll-margin 이 위에 붙은 탭 막대를 비켜 준다
    function goHash(smooth) {
      var t = panelOfHash();
      select(t.id, false);
      if (!t.el) return;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          try { t.el.scrollIntoView({ block: "start", behavior: smooth && !reduceMotion ? "smooth" : "auto" }); } catch (e) { t.el.scrollIntoView(); }
        });
      });
    }
    // 탭 머리(탭 막대의 원래 자리)로 스크롤한다. 탭 막대는 화면 위에 붙어 다니는(sticky) 요소라 막대에 scrollIntoView 를 하면
    // '이미 보인다' 로 보고 움직이지 않는다 → 막대 바로 앞의 빈 표시(.tabs-anchor)의 문서 위치로 직접 간다.
    // always=false 면 이미 탭 머리보다 위(머리글을 보는 중)일 때는 그대로 둔다.
    function scrollToTabs(always) {
      var anchor = document.getElementById("tabs-top") || document.querySelector(".controls");
      if (!anchor) return;
      var y = anchor.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - 4;
      if (!always && (window.pageYOffset || document.documentElement.scrollTop) <= y) return;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      try { window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" }); } catch (e) { window.scrollTo(0, Math.max(0, y)); }
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        select(t.getAttribute("data-panel"), true);
        scrollToTabs(false);
      });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var list = Array.prototype.slice.call(tabs);
        var i = list.indexOf(t) + (e.key === "ArrowRight" ? 1 : -1);
        var next = list[(i + list.length) % list.length];
        next.focus(); next.click();
      });
    });
    document.querySelectorAll("[data-goto-panel]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        select(a.getAttribute("data-goto-panel"), true);
        // 상세 탭 맨 아래 '문제해결 보기'에서 눌러도 새 탭의 맨 위(탭 머리)부터 보이게 늘 올린다
        scrollToTabs(true);
        var tab = document.getElementById("tab-" + a.getAttribute("data-goto-panel"));
        if (tab) { try { tab.focus({ preventScroll: true }); } catch (err) { /* 오래된 브라우저: 초점은 그대로 */ } }
      });
    });
    // 처음: '#problems' 또는 문제해결 패널 안 요소(#case-N)를 가리키면 문제해결 탭을 열고 그 사례로 간다(새로고침·공유한 주소)
    goHash(false);
    window.addEventListener("hashchange", function () { goHash(true); });
  }

  // ---- 직무 필터 (프로젝트 목록) ----
  function setupFilter() {
    var btns = document.querySelectorAll("[data-axis-filter]");
    if (!btns.length) return;
    var cards = document.querySelectorAll("[data-axes]");
    function apply(axis, push) {
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-axis-filter") === axis ? "true" : "false"); });
      cards.forEach(function (c) {
        var axes = (c.getAttribute("data-axes") || "").split(" ");
        c.hidden = !(axis === "all" || axes.indexOf(axis) >= 0);
      });
      document.querySelectorAll("[data-company-group]").forEach(function (g) {
        g.hidden = !g.querySelector("[data-axes]:not([hidden])");
      });
      if (push) {
        var u = new URL(location.href);
        if (axis === "all") u.searchParams.delete("axis"); else u.searchParams.set("axis", axis);
        history.replaceState(null, "", u);
      }
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { apply(b.getAttribute("data-axis-filter"), true); }); });
    var q = new URLSearchParams(location.search).get("axis");
    apply(q && document.querySelector('[data-axis-filter="' + q + '"]') ? q : "all", false);
  }

  // ---- 카드 기울임 (피그마 _HoverInteraction: 커서가 있는 사분면 쪽으로) ----
  function setupTilt() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    document.querySelectorAll("a.card").forEach(function (c) {
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--ry", ((x - 0.5) * 4).toFixed(2) + "deg");
        c.style.setProperty("--rx", ((0.5 - y) * 4).toFixed(2) + "deg");
        c.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      c.addEventListener("mouseleave", function () {
        c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg");
      });
    });
  }

  // ---- 차트 말풍선 ----
  function setupChartTips() {
    var marks = document.querySelectorAll(".chart [data-tip]");
    if (!marks.length) return;
    var tip = document.createElement("div");
    tip.className = "tip"; tip.setAttribute("role", "status");
    document.body.appendChild(tip);
    function show(el, x, y) { tip.textContent = el.getAttribute("data-tip"); tip.style.left = x + "px"; tip.style.top = y + "px"; tip.classList.add("is-on"); }
    marks.forEach(function (m) {
      m.addEventListener("mousemove", function (e) { show(m, e.clientX, e.clientY); });
      m.addEventListener("mouseleave", function () { tip.classList.remove("is-on"); });
      m.addEventListener("focus", function () { var r = m.getBoundingClientRect(); show(m, r.left + r.width / 2, r.top); });
      m.addEventListener("blur", function () { tip.classList.remove("is-on"); });
    });
  }

  // ---- 좁은 화면에서 옆으로 넘기는 차트 판: 키보드로도 넘길 수 있게 ----
  function markChartScroll() {
    document.querySelectorAll(".chart__plot").forEach(function (p) {
      if (p.offsetParent === null) return;
      var wide = p.scrollWidth > p.clientWidth + 1;
      if (wide) { p.setAttribute("tabindex", "0"); p.setAttribute("aria-label", "차트, 옆으로 넘겨 보세요"); }
      else { p.removeAttribute("tabindex"); p.removeAttribute("aria-label"); }
    });
  }
  function setupChartScroll() {
    if (!document.querySelector(".chart__plot")) return;
    markChartScroll();
    var t = 0;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(markChartScroll, 150); });
  }

  // ---- 테마 바꾸기(메뉴의 해·달 단추) ----
  // 머리 스크립트가 그리기 전에 data-theme 를 정해 두었다. 여기서는 단추 이름을 맞추고, 누르면 테마를 바꿔 저장한다(localStorage 'theme').
  // 다른 탭에서 바꾸면 따라 바꾼다. 바뀔 때 화면 전체를 짧게 겹쳐 바꾸고(지원 브라우저, 움직임 줄이기면 바로), 남은 Mermaid 도표는 새 색으로 다시 그린다
  function setupTheme() {
    var btns = document.querySelectorAll("[data-theme-toggle]");
    function label() {
      var to = theme() === "light" ? "다크" : "라이트";
      btns.forEach(function (b) { b.setAttribute("aria-label", to + " 테마로 바꾸기"); });
    }
    function apply(t, save) {
      root.setAttribute("data-theme", t);
      var meta = document.querySelector('meta[name="theme-color"]');
      var bg = token("--bg");
      if (meta && bg) meta.setAttribute("content", bg);
      if (save) { try { localStorage.setItem("theme", t); } catch (e) { /* 저장 못 하는 창(사생활 보호 등): 이번 쪽에서만 바뀐다 */ } }
      label();
      rerenderMermaid();
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var next = theme() === "light" ? "dark" : "light";
        if (document.startViewTransition && !reduceMotion) {
          try { document.startViewTransition(function () { apply(next, true); }); return; } catch (e) { /* 아래에서 바로 바꾼다 */ }
        }
        apply(next, true);
      });
    });
    window.addEventListener("storage", function (e) {
      if (e.key === "theme" && (e.newValue === "light" || e.newValue === "dark") && e.newValue !== theme()) apply(e.newValue, false);
    });
    label();
  }

  // ---- 나타나기: 스크롤 방향에 맞춰(site.css '나타나기' 절) ----
  // 대상: 절 머리·본문 덩어리(도표·표·차트)·카드·숫자·타임라인·사례 블록·정리 상자 등. 대상 안에 든 대상은 바깥 것과 함께 움직인다.
  // 목록 상자(.tiles·.rcards·.sec__bullets·사례 바로가기)는 상자 대신 안의 낱장이 대상이라 형제끼리 시차를 두고 나타난다.
  var RV_SEL = [
    ".block-title", ".sec__head", ".sec__body > :not(.tiles):not(.rcards):not(.sec__bullets):not(.case-jump):not(.mcards-wrap)",
    ".tiles > *", ".rcards__head", ".rcard", ".sec__bullets > li", ".jump__item",
    ".overview__body", ".overview__facts", ".stat", ".grid > .card", ".axis-grid > .card",
    ".ways > *", ".cols2 > *", ".chips", ".rank", ".page-text:not(.intro__text)", ".page-note", ".sub-title", ".page-link",
    ".company__head", ".company__lead", ".htl__item", ".domain", ".tl > li", ".skills-stack > *",
    ".pcase__head", ".pcase__blk", ".pcase__panel", ".pcase__lesson", ".pcase__more",
    ".takeaway", ".pager > a", ".contact"
  ].join(",");
  function setupReveal() {
    if (!root.classList.contains("js-reveal") || !("IntersectionObserver" in window)) return;
    try {
      var found = Array.prototype.slice.call(document.querySelectorAll("#main " + RV_SEL.split(",").join(", #main ")));
      found.forEach(function (el) { el.setAttribute("data-rv", ""); });
      // 바깥 대상만 움직인다(안에 든 대상은 함께 보인다)
      var targets = found.filter(function (el) { return !(el.parentElement && el.parentElement.closest("[data-rv]")); });
      found.forEach(function (el) { el.removeAttribute("data-rv"); });
      var vh = window.innerHeight || root.clientHeight;
      // 처음 화면 안(또는 걸친) 것은 그대로 보인다. 화면 밖·숨은 탭의 것만 숨겨 둔다
      targets.forEach(function (el) {
        el.classList.add("rv");
        var r = el.getBoundingClientRect();
        if (!(r.bottom > 0 && r.top < vh && (r.width || r.height))) el.classList.add("rv-out");
      });
      // 스크롤 방향(내려가는 중인지)
      var lastY = window.pageYOffset || root.scrollTop, goingUp = false;
      window.addEventListener("scroll", function () {
        var y = window.pageYOffset || root.scrollTop;
        if (y !== lastY) { goingUp = y < lastY; lastY = y; }
      }, { passive: true });
      var queue = [], frame = 0;
      function flush() {
        frame = 0;
        queue.sort(function (a, b) { return (a.top - b.top) || (a.left - b.left); });
        queue.forEach(function (q, i) {
          var el = q.el;
          el.style.setProperty("--rv-delay", Math.min(i, 5) * 70 + "ms");
          el.classList.remove("rv-out", "rv-up", "rv-down");
          el.classList.add(q.fromTop ? "rv-down" : "rv-up");
        });
        queue = [];
      }
      // 들어오기: 화면 아래 끝에서 16px 만 올라와도 나타난다(예전 8% 띠는 화면 아래 10~70px 에 걸친 카드가 빈 칸처럼 남았다)
      var inObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var el = e.target;
          if (!e.isIntersecting || !el.classList.contains("rv-out")) return;
          var b = e.boundingClientRect, h = e.rootBounds ? e.rootBounds.height : vh;
          // 위 끝에 걸쳐 들어오면 위에서, 아래 절반에서 들어오면 아래에서, 그 사이(빨리 넘김·바로가기)는 스크롤 방향으로 정한다
          var fromTop = b.top < 0 ? true : b.top > h * 0.5 ? false : goingUp;
          queue.push({ el: el, top: b.top, left: b.left, fromTop: fromTop });
        });
        if (queue.length && !frame) frame = requestAnimationFrame(flush);
      }, { rootMargin: "0px 0px -16px 0px", threshold: 0 });
      // 나가기: 화면 밖으로 완전히 나가면 다시 숨겨, 다음에 들어올 때도 방향에 맞게 나타나게 한다
      var outObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var el = e.target;
          if (e.isIntersecting || el.classList.contains("rv-out")) return;
          el.classList.remove("rv-up", "rv-down");
          el.classList.add("rv-out");
        });
      }, { threshold: 0 });
      targets.forEach(function (el) { inObs.observe(el); outObs.observe(el); });
    } catch (err) {
      // 무엇이든 잘못되면 숨긴 것을 모두 되돌린다
      root.classList.remove("js-reveal");
    }
  }

  function boot() {
    setupTheme();
    setupFilter();
    setupTilt();
    setupChartTips();
    setupChartScroll();
    setupTabs();
    setupReveal(); // 탭·필터가 보일 패널·카드를 정한 뒤에 '처음 화면 안' 을 가린다
    fitFlows(document);
    renderDiagrams(document);
    markControls();
    var t = 0;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { fitFlows(document); refitDiagrams(); markControls(); }, 150);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.addEventListener("load", function () { renderDiagrams(document); });
})();
