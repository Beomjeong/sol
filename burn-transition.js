/**
 * burn-transition.js
 * 섹션 전환 엔진 (전환 효과 없음 — 즉시 전환)
 */

(function () {
  'use strict';

  const SECTIONS           = ['sec01', 'sec02', 'sec03', 'sec04'];
  const NORMAL_SCROLL_FROM = 2;

  let currentIdx   = 0;
  let isTransiting = false;

  const sec02Bg = document.getElementById('sec02bg');

  function showSection(idx) {
    SECTIONS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = (i === idx) ? '' : 'none';
    });

    if (sec02Bg) {
      sec02Bg.classList.toggle('is-active', idx === 1);
    }

    if (idx >= NORMAL_SCROLL_FROM) {
      document.body.style.overflow = '';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  function goTo(nextIdx) {
    if (isTransiting) return;
    if (nextIdx < 0 || nextIdx >= SECTIONS.length) return;
    isTransiting = true;
    currentIdx = nextIdx;
    showSection(nextIdx);
    isTransiting = false;
  }

  window.addEventListener('wheel', (e) => {
    if (isTransiting || currentIdx >= NORMAL_SCROLL_FROM) return;
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

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (isTransiting || currentIdx >= NORMAL_SCROLL_FROM) return;
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 30) return;
    const down = dy > 0;

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

  function init() {
    showSection(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
