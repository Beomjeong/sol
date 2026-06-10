/**
 * burn-transition.js
 * WebGL radial burn/dissolve 전환 엔진
 *
 * 동작:
 *  - sec01 ↔ sec02 : radial burn (중앙 → 사방 / 사방 → 중앙)
 *  - sec02 → sec03+ : 동일 burn 후 일반 스크롤 전환
 *  - sec03, sec04   : 일반 스크롤
 */

(function () {
  'use strict';

  /* ── 섹션 정의 ── */
  const SECTIONS = ['sec01', 'sec02', 'sec03', 'sec04'];
  const SEC02_IDX = 1;
  const NORMAL_SCROLL_FROM = 2; // sec03부터 일반 스크롤

  /* ── 전환 설정 ── */
  const TRANSITION_MS = 900;   // 전환 애니메이션 총 시간 (ms)
  const HOLD_MS       = 80;    // 피크 후 잠깐 홀드 (ms)

  /* ── 상태 ── */
  let currentIdx   = 0;
  let isTransiting = false;
  let sec02ScrollEl = null; // sec02 내용 스크롤 컨테이너

  /* ══════════════════════════════════
     WebGL 초기화
  ══════════════════════════════════ */

  const canvas = document.getElementById('burnCanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    console.warn('[burn] WebGL 미지원 환경 — 폴백: 즉시 전환');
  }

  /* GLSL 셰이더 소스 */
  const VS_SRC = `
    attribute vec2 a_pos;
    varying   vec2 v_uv;
    void main() {
      v_uv        = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  /* Fragment shader:
   * - t       : 0 → 1 (소멸 진행도)
   * - radial  : 중앙 기준 거리 (0=중앙, 1=모서리)
   * - noise   : Perlin-like 값으로 가장자리를 불규칙하게
   * - dir     : +1 = center-out(down), -1 = edge-in(up)
   */
  const FS_SRC = `
    precision mediump float;
    varying vec2 v_uv;

    uniform float u_t;      /* 진행도 0~1 */
    uniform float u_dir;    /* +1 center-out / -1 edge-in */
    uniform vec2  u_res;    /* 해상도 (aspect 보정용) */

    /* --- 간단한 hash 기반 pseudo-noise --- */
    float hash(vec2 p) {
      p = fract(p * vec2(127.1, 311.7));
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f); /* smoothstep */
      return mix(
        mix(hash(i),           hash(i + vec2(1,0)), f.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0; a *= 0.5;
      }
      return v;
    }

    void main() {
      /* aspect-corrected UV */
      vec2 uv     = v_uv;
      float aspect = u_res.x / u_res.y;
      vec2 centered = (uv - 0.5) * vec2(aspect, 1.0);

      /* 중심 거리 0(중앙) ~ 1(모서리) */
      float dist = length(centered) / length(vec2(aspect, 1.0) * 0.5);
      dist = clamp(dist, 0.0, 1.0);

      /* 불규칙 노이즈 (불꽃 모양 경계) */
      float n = fbm(uv * 4.5) * 0.35;

      /* dir +1(center-out): 중앙 먼저 소멸 → threshold = dist + noise */
      /* dir -1(edge-in)   : 가장자리 먼저 소멸 → threshold = (1-dist) + noise */
      float mask;
      if (u_dir > 0.0) {
        mask = dist + n;        /* center-out */
      } else {
        mask = (1.0 - dist) + n; /* edge-in */
      }

      /* t가 올라갈수록 더 많은 픽셀이 투명해짐 */
      float alpha = smoothstep(u_t - 0.05, u_t + 0.05, mask);

      gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
    }
  `;

  let prog, uT, uDir, uRes;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function initGL() {
    if (!gl) return;

    prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER,   VS_SRC));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, FS_SRC));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    /* 전체 화면 quad */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1,  1,-1,  -1,1,
       1,-1,  1, 1,  -1,1
    ]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uT   = gl.getUniformLocation(prog, 'u_t');
    uDir = gl.getUniformLocation(prog, 'u_dir');
    uRes = gl.getUniformLocation(prog, 'u_res');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    resizeCanvas();
  }

  function resizeCanvas() {
    if (!gl) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resizeCanvas);

  /* ══════════════════════════════════
     번 애니메이션
  ══════════════════════════════════ */

  /**
   * @param {number} dir  +1 = center-out, -1 = edge-in
   * @param {Function} onPeak  t=1 도달 시 콜백 (섹션 전환 시점)
   * @param {Function} onDone  애니메이션 완료 콜백
   */
  function playBurn(dir, onPeak, onDone) {
    if (!gl) { onPeak && onPeak(); onDone && onDone(); return; }

    canvas.style.opacity = '1';
    gl.useProgram(prog);
    gl.uniform1f(uDir, dir);
    gl.uniform2f(uRes, canvas.width, canvas.height);

    const halfMs   = TRANSITION_MS / 2;
    let   peakDone = false;
    const start    = performance.now();

    function frame(now) {
      const elapsed = now - start;

      let t;
      if (elapsed < halfMs) {
        /* 0 → 1 : 화면이 타들어감 */
        t = elapsed / halfMs;
      } else if (elapsed < halfMs + HOLD_MS) {
        /* 피크 홀드 */
        t = 1.0;
        if (!peakDone) { peakDone = true; onPeak && onPeak(); }
      } else {
        /* 1 → 0 : 새 섹션 드러남 */
        t = 1.0 - (elapsed - halfMs - HOLD_MS) / halfMs;
        if (!peakDone) { peakDone = true; onPeak && onPeak(); }
      }

      t = Math.max(0, Math.min(1, t));

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (elapsed < TRANSITION_MS + HOLD_MS) {
        requestAnimationFrame(frame);
      } else {
        canvas.style.opacity = '0';
        onDone && onDone();
      }
    }

    requestAnimationFrame(frame);
  }

  /* ══════════════════════════════════
     섹션 전환 로직
  ══════════════════════════════════ */

  function getSectionEl(idx) {
    return document.getElementById(SECTIONS[idx]);
  }

  function showSection(idx) {
    SECTIONS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = (i === idx) ? '' : 'none';
    });

    /* sec02 활성화 시 배경 표시 */
    const sec02 = document.getElementById('sec02');
    if (sec02) {
      sec02.classList.toggle('is-active', idx === SEC02_IDX);
    }

    /* sec03+ : body 스크롤 해제 */
    if (idx >= NORMAL_SCROLL_FROM) {
      document.body.style.overflow = '';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  function goTo(nextIdx, dir) {
    if (isTransiting) return;
    if (nextIdx < 0 || nextIdx >= SECTIONS.length) return;
    isTransiting = true;

    playBurn(dir,
      /* onPeak */ () => { currentIdx = nextIdx; showSection(nextIdx); },
      /* onDone */ () => { isTransiting = false; }
    );
  }

  /* ══════════════════════════════════
     스크롤 이벤트 처리
  ══════════════════════════════════ */

  /* 마우스 휠 */
  window.addEventListener('wheel', (e) => {
    if (isTransiting) return;

    /* sec03+ : 일반 스크롤 — 개입하지 않음 */
    if (currentIdx >= NORMAL_SCROLL_FROM) return;

    const down = e.deltaY > 0;

    if (currentIdx === 0 && down) {
      /* sec01 → sec02 : center-out */
      goTo(1, 1);
    } else if (currentIdx === SEC02_IDX) {
      const content = document.querySelector('.sec--02__content');
      if (down) {
        /* sec02 하단 끝 확인 */
        const atBottom = content
          ? content.scrollTop + content.clientHeight >= content.scrollHeight - 2
          : true;
        if (atBottom) goTo(2, 1);
      } else {
        /* sec02 상단 끝 확인 */
        const atTop = !content || content.scrollTop <= 0;
        if (atTop) goTo(0, -1); /* sec02 → sec01 : edge-in */
      }
    }
  }, { passive: true });

  /* 터치 지원 (모바일) */
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (isTransiting) return;
    if (currentIdx >= NORMAL_SCROLL_FROM) return;

    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 30) return; /* 미세한 터치 무시 */

    const down = dy > 0;

    if (currentIdx === 0 && down) {
      goTo(1, 1);
    } else if (currentIdx === SEC02_IDX) {
      const content = document.querySelector('.sec--02__content');
      if (down) {
        const atBottom = content
          ? content.scrollTop + content.clientHeight >= content.scrollHeight - 2
          : true;
        if (atBottom) goTo(2, 1);
      } else {
        const atTop = !content || content.scrollTop <= 0;
        if (atTop) goTo(0, -1);
      }
    }
  }, { passive: true });

  /* ══════════════════════════════════
     초기화
  ══════════════════════════════════ */

  function init() {
    initGL();
    showSection(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
