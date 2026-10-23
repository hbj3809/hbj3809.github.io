// 황병준 포트폴리오 — 탭(상세·문제해결), 직무 필터, 카드 기울임, 도표(Mermaid) 늦은 렌더링, 차트 말풍선.
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  // ---- Mermaid: 보이는 패널의 도표만 그린다(숨은 패널에서 그리면 크기가 0 으로 계산됨) ----
  var mermaidReady = false;
  function initMermaid() {
    if (mermaidReady || !window.mermaid) return !!window.mermaid;
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: "base",
      fontFamily: '"Inter","Pretendard Variable",Pretendard,"Malgun Gothic",sans-serif',
      themeVariables: {
        darkMode: true,
        background: "transparent",
        fontSize: "17px",
        primaryColor: "#1f2230",
        primaryTextColor: "#d7d8de",
        primaryBorderColor: "#3d6bf4",
        secondaryColor: "#25213a",
        secondaryTextColor: "#d7d8de",
        secondaryBorderColor: "#6a1cfd",
        tertiaryColor: "#1a1c22",
        tertiaryTextColor: "#d7d8de",
        tertiaryBorderColor: "#656a7b",
        lineColor: "#9196a5",
        textColor: "#d7d8de",
        mainBkg: "#1f2230",
        nodeBorder: "#3d6bf4",
        clusterBkg: "rgba(255,255,255,0.03)",
        clusterBorder: "#3f424d",
        titleColor: "#ffffff",
        edgeLabelBackground: "#15161a",
        actorBkg: "#1f2230",
        actorBorder: "#3d6bf4",
        actorTextColor: "#d7d8de",
        actorLineColor: "#656a7b",
        signalColor: "#bfc2cb",
        signalTextColor: "#d7d8de",
        labelBoxBkgColor: "#1f2230",
        labelBoxBorderColor: "#3d6bf4",
        labelTextColor: "#d7d8de",
        loopTextColor: "#d7d8de",
        noteBkgColor: "#25213a",
        noteTextColor: "#d7d8de",
        noteBorderColor: "#6a1cfd",
        activationBkgColor: "#2a2f45",
        activationBorderColor: "#3d6bf4",
        sequenceNumberColor: "#15161a",
        attributeBackgroundColorOdd: "#1a1c22",
        attributeBackgroundColorEven: "#1f2230",
        transitionColor: "#9196a5",
        transitionLabelColor: "#d7d8de",
        stateLabelColor: "#d7d8de",
        stateBkg: "#1f2230",
        compositeBackground: "#1a1c22",
        compositeTitleBackground: "#25213a",
        altBackground: "#1a1c22"
      },
      // 머리 글(묶음 제목·alt/loop 이름표·엔터티 이름)과 내용 사이를 넉넉하게: 묶음 제목 위아래 여백, 시퀀스 상자 여백, ERD 칸 여백을 늘렸다
      // 시퀀스 메시지 글 뒤에 판 색 테두리를 둘러 세로 생명선이 글을 가로지르지 않게, ERD 관계 이름 바탕을 판 색으로 막아 끝 기호가 글자를 가리지 않게
      themeCSS: ".node rect, .node polygon { rx: 12px; ry: 12px; } .cluster rect { rx: 18px; ry: 18px; } .cluster-label { font-weight: 600; } .edgeLabel { font-size: 14px; } .er.entityBox { rx: 10px; ry: 10px; } .er.entityLabel { font-weight: 600; } .loopText, .loopText > tspan { font-weight: 600; } .labelText, .labelText > tspan { font-weight: 600; } .messageText { paint-order: stroke; stroke: #1b1c21; stroke-width: 6px; stroke-linejoin: round; } .relationshipLabelBox { fill: #1b1c21 !important; opacity: 1 !important; }",
      flowchart: { htmlLabels: true, curve: "basis", padding: 18, nodeSpacing: 48, rankSpacing: 60, useMaxWidth: true, subGraphTitleMargin: { top: 14, bottom: 22 } },
      sequence: { mirrorActors: false, actorMargin: 44, messageMargin: 44, boxMargin: 18, boxTextMargin: 12, noteMargin: 16, labelBoxHeight: 26, diagramMarginY: 16 },
      er: { layoutDirection: "LR", fontSize: 15, minEntityWidth: 140, entityPadding: 24, diagramPadding: 24 }
    });
    mermaidReady = true;
    return true;
  }
  // Mermaid 가 window load 때 스스로 기본(밝은) 테마로 그리지 않게, 스크립트가 시작하자마자 설정한다
  // (문제해결 탭 주소로 열면 보이는 도표가 없어 설정이 늦어지던 경합 — 숨은 상세 탭 도표가 기본 테마로 그려지거나 원문이 남았다)
  if (window.mermaid) initMermaid();

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
  function scrollEdges(el) {
    var max = el.scrollWidth - el.clientWidth;
    el.classList.toggle("is-end", el.scrollLeft >= max - 2);
    el.classList.toggle("is-start-off", el.scrollLeft > 2);
  }
  // over=true 면 안내(판 위)와 흐림을 붙이고 startX(그림 안 x, px)가 가운데 오게 처음 위치를 잡는다. false 면 떼어 낸다
  function markScroll(el, over, startX) {
    var prev = el.previousElementSibling;
    var hasHint = prev && prev.classList && prev.classList.contains("scroll-hint");
    if (!over) {
      if (hasHint) prev.parentNode.removeChild(prev);
      el.classList.remove("is-scrollx", "is-end", "is-start-off");
      return;
    }
    if (!hasHint) {
      var p = document.createElement("p");
      p.className = "scroll-hint";
      p.setAttribute("aria-hidden", "true");
      p.innerHTML = HINT_ICON + "<span>옆으로 밀어 전체 보기</span>";
      el.parentNode.insertBefore(p, el);
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
    scrollEdges(el);
  }
  // 판의 실제 안쪽 폭(좌우 padding 을 뺀 값)
  function innerWidth(el) {
    var cs = window.getComputedStyle(el);
    return el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
  }

  // 남은 Mermaid(시퀀스·ERD): 판보다 조금 넓으면(판 폭 ÷ 원래 폭 ≥ 0.66) 판 폭에 맞춰 줄인다.
  // 그보다 넓으면 원래 크기의 80% 로 두고 판 안에서 옆으로 넘긴다(안내 + 흐림 + 가운데부터 보이게)
  function fitDiagram(n) {
    var svg = n.querySelector("svg");
    var media = n.parentElement;
    if (!svg || !media) return;
    var natural = parseFloat(n.getAttribute("data-nw")) || parseFloat(svg.style.maxWidth) || (svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.width : 0);
    if (!natural) return;
    n.setAttribute("data-nw", String(natural));
    var box = innerWidth(media);
    if (!box) return;
    if (natural <= box || box / natural >= 0.66) {
      svg.style.maxWidth = "100%";
      svg.style.width = Math.min(natural, box) + "px";
      n.style.justifyContent = "";
      media.removeAttribute("aria-label");
      markScroll(media, false);
      return;
    }
    svg.style.maxWidth = "none";
    svg.style.width = Math.round(natural * 0.8) + "px";
    n.style.justifyContent = "flex-start";
    media.setAttribute("aria-label", "넓은 도표 — 옆으로 넘겨 보세요");
    markScroll(media, true, (media.scrollWidth) / 2);
  }
  function refitDiagrams() {
    document.querySelectorAll(".mermaid[data-nw]").forEach(function (n) { if (n.offsetParent !== null) fitDiagram(n); });
  }

  // 플로우차트 부품(정적 HTML)의 넓은 그래프: 판 폭에 맞춰 줄여도 글자가 읽히면(넓은 화면 0.85배, 좁은 화면 0.7배 이상) 줄여서 판에 맞추고,
  // 더 넓으면 판 안에서 옆으로 넘긴다(안내 + 흐림 + 첫 상자가 보이게). 스크립트가 없으면 flow.css 의 고정 규칙(zoom)을 그대로 쓴다.
  function fitFlows(root) {
    var wide = window.matchMedia("(min-width: 900px)").matches;
    var minScale = wide ? 0.85 : 0.7;
    (root || document).querySelectorAll(".flow__scroll").forEach(function (sc) {
      if (sc.offsetParent === null) return;
      var cv = sc.querySelector(".flow__canvas");
      if (!cv) return;
      var w = parseFloat(cv.style.width);
      var avail = sc.clientWidth;
      if (!w || !avail) return;
      var s = avail >= w ? 1 : avail / w;
      var over = false;
      if (s < minScale) { s = wide ? minScale : 0.86; over = w * s > avail + 1; }
      s = Math.floor(s * 1000) / 1000;
      cv.style.zoom = String(s);
      var sx = parseFloat(cv.getAttribute("data-start-x"));
      markScroll(sc, over, isNaN(sx) ? 0 : sx * s);
    });
  }

  function renderOne(n) {
    var src = n.getAttribute("data-src") || n.textContent;
    var id = "mmd-" + (++diagramSeq);
    return fontsFor(src).then(function () {
      n.setAttribute("data-processed", "true");
      return window.mermaid.render(id, src, n);
    }).then(function (res) {
      n.innerHTML = res.svg;
      if (res.bindFunctions) res.bindFunctions(n);
      fitDiagram(n);
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
    // 기본 테마로 그려졌거나 원문이 남은 것이라 지우고 다시 그린다
    (root || document).querySelectorAll(".mermaid[data-processed]:not([data-queued])").forEach(function (n) {
      if (n.getAttribute("data-processed") === "fallback") return;
      n.removeAttribute("data-processed");
      n.classList.remove("mermaid--error");
      n.textContent = n.getAttribute("data-src") || n.textContent;
    });
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll(".mermaid:not([data-processed])"));
    nodes = nodes.filter(function (n) { return n.offsetParent !== null && !n.hasAttribute("data-queued"); });
    if (!nodes.length) return;
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
      var panel = document.getElementById("panel-" + id);
      requestAnimationFrame(function () { fitFlows(panel); renderDiagrams(panel); refitDiagrams(); markChartScroll(); });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        select(t.getAttribute("data-panel"), true);
        var bar = document.querySelector(".controls");
        if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: "start" });
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
        var bar = document.querySelector(".controls");
        if (bar) bar.scrollIntoView({ block: "start" });
      });
    });
    var start = (location.hash || "").replace("#", "");
    select(start === "problems" ? "problems" : "detail", false);
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
      if (wide) { p.setAttribute("tabindex", "0"); p.setAttribute("aria-label", "차트 — 옆으로 넘겨 보세요"); }
      else { p.removeAttribute("tabindex"); p.removeAttribute("aria-label"); }
    });
  }
  function setupChartScroll() {
    if (!document.querySelector(".chart__plot")) return;
    markChartScroll();
    var t = 0;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(markChartScroll, 150); });
  }

  function boot() {
    setupFilter();
    setupTilt();
    setupChartTips();
    setupChartScroll();
    setupTabs();
    fitFlows(document);
    renderDiagrams(document);
    var t = 0;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { fitFlows(document); refitDiagrams(); }, 150);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.addEventListener("load", function () { renderDiagrams(document); });
})();
