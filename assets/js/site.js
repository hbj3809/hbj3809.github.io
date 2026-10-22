// 메뉴 열기(모바일), 밝게/어둡게 전환, 프로젝트 직무 필터. 저장소가 막혀 있어도 페이지는 정상 동작한다.
(function () {
  var root = document.documentElement;

  function readTheme() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function saveTheme(v) { try { localStorage.setItem('theme', v); } catch (e) { /* 무시 */ } }
  var saved = readTheme();
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    // 현재 메뉴 표시
    var here = location.pathname.split('/').pop() || 'index.html';
    var inProjects = /\/projects\//.test(location.pathname);
    document.querySelectorAll('.nav a').forEach(function (a) {
      var target = a.getAttribute('href').split('/').pop();
      if (target === here || (inProjects && /projects\.html$/.test(a.getAttribute('href')))) a.setAttribute('aria-current', 'page');
    });

    var menuBtn = document.querySelector('.menu-btn');
    var nav = document.querySelector('.nav');
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    var themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var dark = root.getAttribute('data-theme') === 'dark' ||
          (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        var next = dark ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        saveTheme(next);
      });
    }

    // 프로젝트 필터: 버튼 data-axis 와 카드 data-axes(공백 구분)
    var filters = document.querySelectorAll('.filters button');
    var cards = document.querySelectorAll('.project-card');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var axis = btn.getAttribute('data-axis');
        filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        cards.forEach(function (c) {
          var axes = (c.getAttribute('data-axes') || '').split(/\s+/);
          c.hidden = !(axis === 'all' || axes.indexOf(axis) >= 0);
        });
      });
    });
  });
})();
