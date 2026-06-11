/**
 * mission-particles.js
 * mission-reward 이미지 영역에 금가루 파티클 (아래→위 부유)
 * 조기소진(is-soldout) 상태에서는 렌더링 중단
 */
(function () {
  'use strict';

  var GOLDS = ['#E2BD7C', '#FFE99E', '#F5D07A', '#EADBB8', '#FFD97B', '#FFF0B0'];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeParticle(w, h, yOrigin) {
    var spawnY = h * yOrigin + rand(0, 16);
    return {
      x:       rand(w * 0.05, w * 0.95),
      y:       spawnY,
      r:       rand(0.6, 1.4),
      vy:      rand(0.3, 0.65),
      phase:   rand(0, Math.PI * 2),
      swing:   rand(0.15, 0.45),
      life:    0,
      maxLife: Math.round(rand(100, 180)),
      peak:    rand(0.35, 0.75),
      color:   GOLDS[Math.floor(Math.random() * GOLDS.length)],
    };
  }

  function initParticles(canvasTarget, soldoutTarget, opts) {
    var yOrigin = (opts && opts.yOrigin != null) ? opts.yOrigin : 1.0;
    var canvas = document.createElement('canvas');
    canvas.style.cssText = [
      'position:absolute', 'inset:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:3'
    ].join(';');
    canvasTarget.appendChild(canvas);

    var ctx  = canvas.getContext('2d');
    var pool = [];
    var MAX  = 20;

    function resize() {
      canvas.width  = canvasTarget.offsetWidth;
      canvas.height = canvasTarget.offsetHeight;
    }

    function tick() {
      requestAnimationFrame(tick);

      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 조기소진 시 렌더링 중단 (캔버스만 비우고 종료)
      if (soldoutTarget.classList.contains('is-soldout')) return;

      // 스폰
      if (pool.length < MAX && Math.random() < 0.10) {
        pool.push(makeParticle(w, h, yOrigin));
      }

      pool = pool.filter(function (p) {
        p.life++;
        var t = p.life / p.maxLife;

        // 페이드 인 (하단 20%) → 유지 → 페이드 아웃 (상단 25%)
        var alpha = t < 0.20 ? p.peak * (t / 0.20)
                  : t > 0.75 ? p.peak * ((1 - t) / 0.25)
                  : p.peak;

        p.y -= p.vy;
        p.x += Math.sin(p.life * 0.045 + p.phase) * p.swing * 0.35;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.life < p.maxLife;
      });
    }

    resize();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(canvasTarget);
    }
    tick();
  }

  function init() {
    // Mission 01 — img-wrap 위에 파티클, mission-reward 의 is-soldout 체크
    var m1Canvas   = document.querySelector('#mission01 .mission-reward__img-wrap');
    var m1Soldout  = document.querySelector('#mission01 .mission-reward');
    if (m1Canvas && m1Soldout) initParticles(m1Canvas, m1Soldout);

    // Mission 02 — package 위에 파티클, package 의 is-soldout 체크
    // yOrigin: 0.0=상단 / 1.0=하단 — 이미지 영역 하단에서 시작하도록 조정
    var m2Canvas   = document.querySelector('#mission02 .mission-reward__package');
    var m2Soldout  = m2Canvas;
    if (m2Canvas) initParticles(m2Canvas, m2Soldout, { yOrigin: 0.3 });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
