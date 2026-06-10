(function () {
  'use strict';

  const canvas = document.getElementById('particleCanvas');
  const ctx    = canvas.getContext('2d');

  /* 금가루 컬러 팔레트 */
  const COLORS = ['#E2BD7C', '#EADBB8', '#F2EFE9', '#FFE99E'];

  /* 파티클 수 & 크기 분포 */
  const TIERS = [
    { count: 110, rMin: 0.25, rMax: 0.55 }, /* 미세 먼지 */
    { count: 50,  rMin: 0.55, rMax: 0.9  }, /* 중간 */
    { count: 20,  rMin: 0.9,  rMax: 1.4  }, /* 반짝이는 큰 입자 */
  ];

  let W, H;
  let particles = [];
  let raf;

  /* ── 유틸 ── */
  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ── 캔버스 크기 동기화 ── */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  /* ── 파티클 생성 ── */
  function spawn(r) {
    return {
      x:       rand(0, W),
      y:       rand(-20, H * 0.5),       /* 상단 50% 영역에 분산 */
      r:       r,
      color:   COLORS[Math.floor(Math.random() * COLORS.length)],
      vx:      rand(-0.2, 0.2),
      vy:      rand(0.12, 0.5),          /* 아래로 천천히 부유 */
      life:    0,
      maxLife: rand(220, 520),           /* 3.5~8.5초 @ 60fps */
      phase:   rand(0, Math.PI * 2),
      freq:    rand(0.006, 0.016),       /* 좌우 흔들림 주기 */
      amp:     rand(0.15, 0.55),         /* 좌우 흔들림 크기 */
    };
  }

  /* ── 초기 파티클 풀 생성 ── */
  function initPool() {
    particles = [];
    TIERS.forEach(({ count, rMin, rMax }) => {
      for (let i = 0; i < count; i++) {
        const p = spawn(rand(rMin, rMax));
        p.life = Math.floor(rand(0, p.maxLife)); /* 처음부터 흩어져 있도록 */
        particles.push(p);
      }
    });
  }

  /* ── 매 프레임 ── */
  function frame() {
    ctx.clearRect(0, 0, W, H);

    const dead = [];

    particles.forEach((p, i) => {
      p.life++;

      /* opacity: fade-in(15%) / hold / fade-out(15%) + sin 반짝임 */
      const t = p.life / p.maxLife;
      let alpha;
      if      (t < 0.15) alpha = t / 0.15;
      else if (t > 0.85) alpha = (1 - t) / 0.15;
      else               alpha = 1;

      const twinkle = 0.55 + 0.45 * Math.sin(p.life * p.freq * 5 + p.phase);
      alpha *= twinkle * 0.75;

      /* 위치 갱신 */
      p.x += p.vx + Math.sin(p.life * p.freq + p.phase) * p.amp;
      p.y += p.vy;

      /* 수명 끝 또는 화면 위로 벗어남 → 교체 */
      if (p.life >= p.maxLife || p.y > H + 20) {
        dead.push(i);
        return;
      }

      /* 방사형 글로우로 금가루 질감 표현 */
      const glow = p.r * 2.8;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
      g.addColorStop(0,   p.color);
      g.addColorStop(0.3, p.color);
      g.addColorStop(1,   'rgba(0,0,0,0)');

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle   = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    /* 사라진 파티클 교체 */
    dead.reverse().forEach(i => {
      const tier = TIERS[Math.floor(Math.random() * TIERS.length)];
      const p    = spawn(rand(tier.rMin, tier.rMax));
      p.y = rand(-20, 0);
      particles[i] = p;
    });

    raf = requestAnimationFrame(frame);
  }

  /* ── 초기화 ── */
  window.addEventListener('resize', () => { resize(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resize(); initPool(); frame(); });
  } else {
    resize(); initPool(); frame();
  }

})();
