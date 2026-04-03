/* Wheels Process Wiki — wiki.js */
(function () {
  'use strict';

  /* ── SITE ROOT ─────────────────────────────────────────────────── */
  function getSiteRoot() {
    var parts = window.location.pathname.replace(/\/+$/, '').split('/');
    var repoIdx = parts.indexOf('WheelsProcessWiki');
    if (repoIdx >= 0) {
      var depth = parts.length - repoIdx - 1;
      if (depth === 0) return './';
      return Array(depth).fill('..').join('/') + '/';
    }
    var depth = parts.length - 1;
    if (depth <= 0) return './';
    return Array(depth).fill('..').join('/') + '/';
  }

  /* ── SIDEBAR TOGGLE ─────────────────────────────────────────────── */
  function initSidebar() {
    var btn = document.querySelector('.sidebar-toggle');
    var sb  = document.querySelector('.wiki-sidebar');
    if (!btn || !sb) return;
    btn.addEventListener('click', function () {
      var collapsed = sb.classList.toggle('collapsed');
      btn.classList.toggle('collapsed', collapsed);
      btn.textContent = collapsed ? '▶' : '◀';
      try { localStorage.setItem('whl_sb', collapsed ? '1' : '0'); } catch (e) {}
    });
    try {
      if (localStorage.getItem('whl_sb') === '1') {
        sb.classList.add('collapsed');
        btn.classList.add('collapsed');
        btn.textContent = '▶';
      }
    } catch (e) {}
  }

  /* ── SEARCH (/ shortcut + redirect) ─────────────────────────────── */
  function initSearch() {
    var box = document.getElementById('searchBox') ||
              document.querySelector('.searchBox') ||
              document.querySelector('[id="searchBox"]');
    if (!box) return;
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== box &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        box.focus();
      }
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = box.value.trim();
        if (!q) return;
        var root = getSiteRoot();
        window.location.href = root + 'search.html?q=' + encodeURIComponent(q);
      }
    });
  }

  /* ── SEARCH PAGE ─────────────────────────────────────────────────── */
  function runSearchPage() {
    var container = document.getElementById('search-results');
    if (!container) return;
    var params = new URLSearchParams(window.location.search);
    var query  = (params.get('q') || '').trim().toLowerCase();
    var queryEl = document.getElementById('search-query');
    if (queryEl) queryEl.textContent = '"' + query + '"';
    if (!query) { container.innerHTML = '<p style="color:#64748b">Enter a search term above.</p>'; return; }

    var root = getSiteRoot();
    fetch(root + 'search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (index) {
        var tokens = query.split(/\s+/).filter(Boolean);
        var results = [];
        index.forEach(function (item) {
          var hay = (
            (item.pid    || '') + ' ' +
            (item.l1     || '') + ' ' +
            (item.l2     || '') + ' ' +
            (item.name   || '') + ' ' +
            (item.steps  || '') + ' ' +
            (item.systems|| '')
          ).toLowerCase();
          var score = 0;
          tokens.forEach(function (tok) {
            if (hay.includes(tok)) score++;
          });
          if (score > 0) results.push({ item: item, score: score });
        });
        results.sort(function (a, b) { return b.score - a.score; });
        if (results.length === 0) {
          container.innerHTML = '<p style="color:#64748b">No results for <strong>' + query + '</strong>.</p>';
          return;
        }
        var html = '';
        results.forEach(function (r) {
          var it = r.item;
          var highlight = function (text) {
            var t = text || '';
            tokens.forEach(function (tok) {
              var re = new RegExp('(' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
              t = t.replace(re, '<em>$1</em>');
            });
            return t;
          };
          html += '<a class="search-result-item" href="' + root + (it.url || '') + '">' +
            '<div class="sri-id">' + (it.pid || '') + '</div>' +
            '<div class="sri-name">' + highlight(it.name) + '</div>' +
            '<div class="sri-path">' + (it.l1 || '') + ' › ' + (it.l2 || '') + '</div>' +
            (it.systems ? '<div class="sri-match">Systems: ' + highlight(it.systems) + '</div>' : '') +
            '</a>';
        });
        container.innerHTML = html;
      })
      .catch(function (e) {
        container.innerHTML = '<p style="color:#dc2626">Error loading search index.</p>';
      });
  }

  /* ── LIGHTBOX (full zoom+pan+pinch+keyboard) ─────────────────────── */
  function initLightbox() {
    var lb    = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightboxImg');
    if (!lb || !lbImg) return;

    var scale = 1, ox = 0, oy = 0;
    var dragging = false, startX, startY, startOX, startOY;

    function applyTransform() {
      lbImg.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + scale + ')';
      var pct = Math.round(scale * 100);
      var el = document.getElementById('lbScale');
      if (el) el.textContent = pct + '%';
    }
    function reset() { scale = 1; ox = 0; oy = 0; applyTransform(); }
    function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

    document.querySelectorAll('.diagram-wrap img, .ea-wrap img').forEach(function (img) {
      img.parentElement.addEventListener('click', function () {
        lbImg.src = img.src;
        reset();
        lb.classList.add('active');
      });
    });

    lb.addEventListener('click', function (e) {
      if (e.target === lb) { lb.classList.remove('active'); }
    });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') { lb.classList.remove('active'); }
      if (e.key === '+' || e.key === '=') { scale = clamp(scale * 1.2, 0.2, 8); applyTransform(); }
      if (e.key === '-') { scale = clamp(scale / 1.2, 0.2, 8); applyTransform(); }
      if (e.key === '0') { reset(); }
    });

    lbImg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = lbImg.getBoundingClientRect();
      var mx = e.clientX - rect.left - rect.width / 2;
      var my = e.clientY - rect.top  - rect.height / 2;
      var factor = e.deltaY < 0 ? 1.15 : 0.87;
      var newScale = clamp(scale * factor, 0.2, 8);
      ox = ox - mx * (newScale / scale - 1);
      oy = oy - my * (newScale / scale - 1);
      scale = newScale;
      applyTransform();
    }, { passive: false });

    lbImg.addEventListener('mousedown', function (e) {
      dragging = true; startX = e.clientX; startY = e.clientY;
      startOX = ox; startOY = oy;
      lbImg.classList.add('dragging');
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      ox = startOX + (e.clientX - startX);
      oy = startOY + (e.clientY - startY);
      applyTransform();
    });
    document.addEventListener('mouseup', function () {
      dragging = false; lbImg.classList.remove('dragging');
    });
    lbImg.addEventListener('dblclick', function () {
      if (scale >= 4) { reset(); } else { scale = clamp(scale * 2, 0.2, 8); applyTransform(); }
    });

    var lastDist = null;
    lb.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (lastDist !== null) {
          scale = clamp(scale * (dist / lastDist), 0.2, 8);
          applyTransform();
        }
        lastDist = dist;
      }
    }, { passive: false });
    lb.addEventListener('touchend', function () { lastDist = null; });

    var zIn  = document.getElementById('lbZoomIn');
    var zOut = document.getElementById('lbZoomOut');
    var zRst = document.getElementById('lbReset');
    var zCls = document.getElementById('lbClose');
    if (zIn)  zIn.addEventListener('click',  function () { scale = clamp(scale*1.25,0.2,8); applyTransform(); });
    if (zOut) zOut.addEventListener('click', function () { scale = clamp(scale/1.25,0.2,8); applyTransform(); });
    if (zRst) zRst.addEventListener('click', reset);
    if (zCls) zCls.addEventListener('click', function () { lb.classList.remove('active'); });
  }

  /* ── INIT ────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
    initSearch();
    runSearchPage();
    initLightbox();
  });
})();
