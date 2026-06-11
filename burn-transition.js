/**
 * burn-transition.js
 * 섹션 전환 엔진 (전환 효과 없음 — 즉시 전환)
 * 1024px 미만에서는 스크롤 하이재킹 비활성화, 일반 스크롤로 동작
 */

(function () {
  'use strict';

  const SECTIONS           = ['sec01', 'sec02', 'sec03', 'sec04'];
  const NORMAL_SCROLL_FROM = 2;
  const MOBILE_BP          = 1024;

  let currentIdx   = 0;
  let isTransiting = false;

  const sec02Bg = document.getElementById('sec02bg');
  const sec03Bg = document.getElementById('sec03bg');

  function isMobileWidth() {
    return window.innerWidth < MOBILE_BP;
  }

  function showSection(idx) {
    SECTIONS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = (i === idx) ? '' : 'none';
    });

    if (sec02Bg) {
      sec02Bg.classList.toggle('is-active', idx === 1);
    }

    if (sec03Bg) {
      sec03Bg.classList.toggle('is-active', idx === 2);
    }

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
    // sec02bg는 CSS에서 display:none 처리 — is-active 불필요
    document.body.style.overflow = 'auto';
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
    if (isMobileWidth() || isTransiting) return;

    // 일반 스크롤 섹션(sec03+) 최상단에서 위로 → sec02 복귀
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

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (isMobileWidth() || isTransiting) return;

    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 30) return;
    const down = dy > 0;

    // 일반 스크롤 섹션(sec03+) 최상단에서 위로 → sec02 복귀
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

  window.addEventListener('resize', () => {
    if (isMobileWidth()) initMobile();
  });

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

})();
