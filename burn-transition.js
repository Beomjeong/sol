/**
 * burn-transition.js
 * 섹션 전환 엔진
 *
 * sec01 ↔ sec02 : 블랙 플래시 (페이드 아웃 → 섹션 교체 → 페이드 인)
 * sec02 → sec03+ : 즉시 전환 (일반 스크롤 개시)
 * < 1024px       : 스크롤 하이재킹 비활성화, 일반 스크롤
 */

(function () {
  'use strict';

  const SECTIONS           = ['sec01', 'sec02', 'sec03', 'sec04'];
  const NORMAL_SCROLL_FROM = 2;
  const MOBILE_BP          = 1024;

  const FLASH_FADE_IN  = 350; // ms — 검정으로 페이드
  const FLASH_FADE_OUT = 350; // ms — 다음 섹션 페이드 인

  let currentIdx   = 0;
  let isTransiting = false;

  const sec02Bg = document.getElementById('sec02bg');
  const sec03Bg = document.getElementById('sec03bg');

  // ── 블랙 플래시 오버레이 ──────────────────────────────────
  const flashOverlay = (function () {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:500',
      'background:#000', 'pointer-events:none', 'opacity:0'
    ].join(';');
    document.body.appendChild(el);
    return el;
  }());

  function isMobileWidth() {
    return window.innerWidth < MOBILE_BP;
  }

  function animateFade(from, to, duration, onComplete) {
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      flashOverlay.style.opacity = (from + (to - from) * t).toFixed(3);
      if (t < 1) requestAnimationFrame(frame);
      else onComplete?.();
    }
    requestAnimationFrame(frame);
  }

  // ── 섹션 표시 ─────────────────────────────────────────────
  function showSection(idx) {
    SECTIONS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (idx >= NORMAL_SCROLL_FROM) {
        el.style.display = (i >= NORMAL_SCROLL_FROM) ? '' : 'none';
      } else {
        el.style.display = (i === idx) ? '' : 'none';
      }
    });

    if (sec02Bg) sec02Bg.classList.toggle('is-active', idx === 1);
    if (sec03Bg) sec03Bg.classList.toggle('is-active', idx >= 2);

    if (idx >= NORMAL_SCROLL_FROM) {
      document.body.style.overflow = 'auto';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  function initMobile() {
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });
    document.body.style.overflow = 'auto';
  }

  // ── 블랙 플래시 트랜지션 ──────────────────────────────────
  function blackFlash(nextIdx) {
    // 페이드 → 검정
    animateFade(0, 1, FLASH_FADE_IN, () => {
      // 검정 화면에서 섹션 교체
      currentIdx = nextIdx;
      showSection(nextIdx);

      // 검정 → 다음 섹션 페이드 인
      animateFade(1, 0, FLASH_FADE_OUT, () => {
        isTransiting = false;
      });
    });
  }

  // ── 섹션 이동 ─────────────────────────────────────────────
  function goTo(nextIdx) {
    if (isTransiting) return;
    if (nextIdx < 0 || nextIdx >= SECTIONS.length) return;
    isTransiting = true;

    const prevIdx = currentIdx;
    const useFlash = (prevIdx === 0 && nextIdx === 1) ||
                     (prevIdx === 1 && nextIdx === 0) ||
                     (prevIdx === 1 && nextIdx >= NORMAL_SCROLL_FROM) ||
                     (prevIdx >= NORMAL_SCROLL_FROM && nextIdx === 1);

    if (useFlash) {
      blackFlash(nextIdx);
    } else {
      currentIdx = nextIdx;
      showSection(nextIdx);
      isTransiting = false;
    }
  }

  // ── 휠 ───────────────────────────────────────────────────
  window.addEventListener('wheel', (e) => {
    if (isMobileWidth() || isTransiting) return;

    if (currentIdx >= NORMAL_SCROLL_FROM) {
      if (currentIdx === NORMAL_SCROLL_FROM && e.deltaY < 0 && window.scrollY === 0) {
        goTo(NORMAL_SCROLL_FROM - 1);
      }
      return;
    }

    const down = e.deltaY > 0;

    if (currentIdx === 0 && down) {
      goTo(1);
    } else if (currentIdx === 1) {
      const content = document.querySelector('.sec--02__content');
      if (down) {
        const atBottom = !content ||
          content.scrollTop + content.clientHeight >= content.scrollHeight - 2;
        if (atBottom) goTo(2);
      } else {
        const atTop = !content || content.scrollTop <= 0;
        if (atTop) goTo(0);
      }
    }
  }, { passive: true });

  // ── 터치 ─────────────────────────────────────────────────
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (isMobileWidth() || isTransiting) return;

    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 30) return;
    const down = dy > 0;

    if (currentIdx >= NORMAL_SCROLL_FROM) {
      if (currentIdx === NORMAL_SCROLL_FROM && !down && window.scrollY === 0) {
        goTo(NORMAL_SCROLL_FROM - 1);
      }
      return;
    }

    if (currentIdx === 0 && down) {
      goTo(1);
    } else if (currentIdx === 1) {
      const content = document.querySelector('.sec--02__content');
      if (down) {
        const atBottom = !content ||
          content.scrollTop + content.clientHeight >= content.scrollHeight - 2;
        if (atBottom) goTo(2);
      } else {
        const atTop = !content || content.scrollTop <= 0;
        if (atTop) goTo(0);
      }
    }
  }, { passive: true });

  // ── 리사이즈 ─────────────────────────────────────────────
  window.addEventListener('resize', () => {
    if (isMobileWidth()) initMobile();
  });

  // ── 초기화 ───────────────────────────────────────────────
  function init() {
    if (isMobileWidth()) {
      initMobile();
    } else {
      showSection(0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
