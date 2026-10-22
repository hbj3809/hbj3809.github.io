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

  function renderDiagrams(root) {
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll(".mermaid:not([data-processed])"));
    nodes = nodes.filter(function (n) { return n.offsetParent !== null; });
    if (!nodes.length) return;
    if (!initMermaid()) {
      // CDN 을 못 불러오면 원문을 그대로 보여 준다
      nodes.forEach(function (n) { n.classList.add("mermaid--error"); n.setAttribute("data-processed", "fallback"); });
      return;
    }
    window.mermaid.run({ nodes: nodes, suppressErrors: true }).then(function () {
      nodes.forEach(function (n) {
        var svg = n.querySelector("svg");
        if (!svg) { n.classList.add("mermaid--error"); n.textContent = n.getAttribute("data-src") || n.textContent; return; }
        // 넓은 도표는 판 폭에 맞춰 줄이면 글자가 너무 작아진다 → 원래 크기의 85% 아래로는 줄이지 않고 판 안에서 옆으로 넘긴다
        var natural = parseFloat(svg.style.maxWidth) || (svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.width : 0);
        var box = n.parentElement ? n.parentElement.clientWidth - 16 : 0;
        if (natural && box && natural * 0.85 > box) {
          svg.style.maxWidth = "none";
          svg.style.width = Math.round(natural * 0.85) + "px";
          n.style.justifyContent = "flex-start";
          n.parentElement.setAttribute("tabindex", "0");
          n.parentElement.setAttribute("aria-label", "넓은 도표 — 옆으로 넘겨 보세요");
        }
      });
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
      requestAnimationFrame(function () { renderDiagrams(panel); });
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

  function boot() {
    setupFilter();
    setupTilt();
    setupChartTips();
    setupTabs();
    renderDiagrams(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.addEventListener("load", function () { renderDiagrams(document); });
})();
