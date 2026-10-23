// 황병준 포트폴리오 — 탭(상세·문제해결), 직무 필터, 카드 기울임, 도표(Mermaid) 늦은 렌더링, 차트 말풍선.
(function () {
  "use strict";

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
      themeCSS: ".node rect, .node polygon { rx: 12px; ry: 12px; } .cluster rect { rx: 18px; ry: 18px; } .edgeLabel { font-size: 14px; } .er.entityBox { rx: 10px; ry: 10px; }",
      flowchart: { htmlLabels: true, curve: "basis", padding: 18, nodeSpacing: 48, rankSpacing: 60, useMaxWidth: true },
      sequence: { mirrorActors: false, actorMargin: 60, messageMargin: 36 },
      er: { layoutDirection: "LR", minEntityWidth: 120 }
    });
    mermaidReady = true;
    return true;
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

  // 넓은 도표는 판 폭에 맞춰 줄이면 글자가 너무 작아진다 → 원래 크기의 85% 아래로는 줄이지 않고 판 안에서 옆으로 넘긴다
  function fitDiagram(n) {
    var svg = n.querySelector("svg");
    if (!svg) return;
    var natural = parseFloat(svg.style.maxWidth) || (svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.width : 0);
    var box = n.parentElement ? n.parentElement.clientWidth - 16 : 0;
    if (natural && box && natural * 0.85 > box) {
      svg.style.maxWidth = "none";
      svg.style.width = Math.round(natural * 0.85) + "px";
      n.style.justifyContent = "flex-start";
      n.parentElement.setAttribute("tabindex", "0");
      n.parentElement.setAttribute("aria-label", "넓은 도표 — 옆으로 넘겨 보세요");
    }
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
      requestAnimationFrame(function () { renderDiagrams(panel); markChartScroll(); });
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
    renderDiagrams(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.addEventListener("load", function () { renderDiagrams(document); });
})();
