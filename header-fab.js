/* ══════════════════════════════════════════════════
   header-fab.js
   - PC방 토글 상태 제어
   - 공유하기 (모달 + 각 SNS)
   - 모바일 헤더 hide-on-scroll + FAB (공유/TOP 버튼)

   사용법:
   1. ogImage가 페이지마다 다를 경우, 이 스크립트보다 앞에 선언:
      <script>var SHARE_OG_IMAGE = 'https://...';</script>

   2. 스크립트 로드:
      <script src="[경로]/headerandbt/header-fab.js"></script>

   3. PC방 접속 여부 확인 후 백엔드에서 호출:
      setPcRoomToggleState(true);  // PC방 접속 시
      setPcRoomToggleState(false); // 개인 PC 접속 시
══════════════════════════════════════════════════ */

/* 이 스크립트 파일 기준 img/ 폴더 경로를 자동으로 추적 */
var _hfBase = (document.currentScript && document.currentScript.src)
  ? document.currentScript.src.replace(/[^/]*$/, '')
  : '';


/* ============================================
   PC방 토글 이미지 상태 (백엔드 연동용)
============================================ */
function setPcRoomToggleState(isPcRoom) {
  var toggleBtn = document.getElementById('pcRoomToggle');
  if (!toggleBtn) { return; }
  var toggleImg = toggleBtn.querySelector('.toggle-btn__img');
  if (!toggleImg) { return; }
  var isOn = Boolean(isPcRoom);
  toggleBtn.dataset.state = isOn ? 'on' : 'off';
  toggleImg.src = isOn ? (_hfBase + 'assets/off=on.png') : (_hfBase + 'assets/off=off.png');
  toggleImg.alt = isOn ? 'PC방 모드 ON' : 'PC방 모드 OFF';
}

// 기본값 OFF (백엔드에서 접속 상태 확인 후 setPcRoomToggleState 호출)
setPcRoomToggleState(false);


/* ============================================
   공유하기
============================================ */
// ▼▼ 배포 시 아래 값 확인 후 배포 ▼▼
var _ogTitleEl = document.querySelector('meta[property="og:title"]');
var _ogDescEl  = document.querySelector('meta[property="og:description"]');
var SHARE_CONFIG = {
  title:       _ogTitleEl ? _ogTitleEl.getAttribute('content') : document.title,
  description: _ogDescEl  ? _ogDescEl.getAttribute('content')  : '',
  kakaoKey:    'd1c0c39f4dbac0062bf36527a3021357',
  ogImage:     (typeof SHARE_OG_IMAGE !== 'undefined') ? SHARE_OG_IMAGE : ''
};

var copyToast = document.getElementById('copyToast');
var copyToastTimer = null;
var DEFAULT_TOAST_MSG = '클립보드에 복사되었습니다.';
function showCopyToast(msg) {
  if (!copyToast) { return; }
  copyToast.textContent = msg || DEFAULT_TOAST_MSG;
  copyToast.classList.add('is-visible');
  if (copyToastTimer) { clearTimeout(copyToastTimer); }
  copyToastTimer = setTimeout(function() {
    copyToast.classList.remove('is-visible');
  }, 2200);
}
function fallbackCopyText(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  var copied = false;
  try { copied = document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(textarea);
  return copied;
}
function copyUrlWithToast(url, toastMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(function() {
      showCopyToast(toastMsg);
    }).catch(function() {
      if (fallbackCopyText(url)) { showCopyToast(toastMsg); }
    });
  } else if (fallbackCopyText(url)) {
    showCopyToast(toastMsg);
  }
}

// Kakao SDK 초기화
(function initKakao() {
  if (!window.Kakao || !SHARE_CONFIG.kakaoKey) { return; }
  if (Kakao.isInitialized && Kakao.isInitialized()) { return; }
  try { Kakao.init(SHARE_CONFIG.kakaoKey); } catch (e) {}
})();

// 공유 모달 열기/닫기
var shareModal = document.getElementById('shareModal');
var shareModalClose = document.getElementById('shareModalClose');
var lastShareTrigger = null;
function openShareModal(trigger) {
  if (!shareModal) { return; }
  lastShareTrigger = trigger || null;
  shareModal.classList.add('is-open');
  shareModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (shareModalClose) { shareModalClose.focus(); }
}
function closeShareModal() {
  if (!shareModal) { return; }
  shareModal.classList.remove('is-open');
  shareModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastShareTrigger && lastShareTrigger.focus) { lastShareTrigger.focus(); }
}
if (shareModal) {
  shareModal.addEventListener('click', function(e) {
    if (e.target === shareModal) { closeShareModal(); }
  });
}
if (shareModalClose) {
  shareModalClose.addEventListener('click', closeShareModal);
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && shareModal && shareModal.classList.contains('is-open')) {
    closeShareModal();
  }
});

// SNS별 공유 동작
function openPopup(url) {
  var w = 600, h = 600;
  var left = (window.screen.width  - w) / 2;
  var top  = (window.screen.height - h) / 2;
  window.open(url, '_blank', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',noopener');
}
function shareFacebook() {
  var u = encodeURIComponent(window.location.href);
  openPopup('https://www.facebook.com/sharer/sharer.php?u=' + u);
}
function shareTwitter() {
  var u = encodeURIComponent(window.location.href);
  var t = encodeURIComponent(SHARE_CONFIG.title);
  openPopup('https://twitter.com/intent/tweet?url=' + u + '&text=' + t);
}
function shareNaver() {
  var u = encodeURIComponent(window.location.href);
  var t = encodeURIComponent(SHARE_CONFIG.title);
  openPopup('https://share.naver.com/web/shareView?url=' + u + '&title=' + t);
}
function shareKakao() {
  if (!window.Kakao || !Kakao.Share) { return; }
  if (!Kakao.isInitialized || !Kakao.isInitialized()) { return; }
  try {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: SHARE_CONFIG.title,
        description: SHARE_CONFIG.description,
        imageUrl: SHARE_CONFIG.ogImage,
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href
        }
      },
      buttons: [{
        title: '자세히 보기',
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href
        }
      }]
    });
  } catch (e) {}
}
function shareInstagram() {
  copyUrlWithToast(window.location.href, 'URL이 복사되었습니다. 인스타그램에 붙여넣어 주세요.');
}
function shareCopy() {
  copyUrlWithToast(window.location.href, '클립보드에 복사되었습니다.');
}
var SHARE_HANDLERS = {
  kakao:     shareKakao,
  facebook:  shareFacebook,
  twitter:   shareTwitter,
  naver:     shareNaver,
  instagram: shareInstagram,
  copy:      shareCopy
};
if (shareModal) {
  shareModal.addEventListener('click', function(e) {
    var target = e.target.closest ? e.target.closest('[data-share]') : null;
    if (!target) { return; }
    var type = target.getAttribute('data-share');
    var handler = SHARE_HANDLERS[type];
    if (typeof handler === 'function') {
      handler();
      closeShareModal();
    }
  });
}

var btnShare = document.getElementById('btnShare');
if (btnShare) {
  btnShare.addEventListener('click', function() { openShareModal(btnShare); });
}
var btnShareFloating = document.getElementById('btnShareFloating');
if (btnShareFloating) {
  btnShareFloating.addEventListener('click', function() { openShareModal(btnShareFloating); });
}
var btnScrollTop = document.getElementById('btnScrollTop');
if (btnScrollTop) {
  btnScrollTop.addEventListener('click', function(e) {
    e.preventDefault();
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var behavior = reduce ? 'auto' : 'smooth';
    var el = document.querySelector('.parallax-root') || document.scrollingElement || document.documentElement;
    try {
      el.scrollTo({ top: 0, left: 0, behavior: behavior });
    } catch (err) {
      el.scrollTop = 0;
    }
  });
}


/* ============================================
   모바일 헤더 hide-on-scroll + TOP 버튼
============================================ */
(function () {
  var header = document.querySelector('.cb-header');
  var topBtn = document.getElementById('btnScrollTop');
  var lastY = 0;
  var THRESHOLD = 8;
  var mq = window.matchMedia('(max-width: 1024px)');
  var scrollEl = document.querySelector('.parallax-root') || window;

  function getScrollY() {
    return scrollEl === window
      ? (window.scrollY || window.pageYOffset)
      : scrollEl.scrollTop;
  }

  scrollEl.addEventListener('scroll', function () {
    var currentY = getScrollY();

    if (mq.matches) {
      if (header && Math.abs(currentY - lastY) >= THRESHOLD) {
        if (currentY > lastY && currentY > 0) {
          header.style.transform = 'translateY(-100%)';
        } else {
          header.style.transform = '';
        }
        lastY = currentY;
      }
    } else {
      if (header) { header.style.transform = ''; }
      lastY = currentY;
    }

    if (topBtn) {
      if (mq.matches && currentY > 1000) {
        topBtn.classList.add('is-visible');
      } else {
        topBtn.classList.remove('is-visible');
      }
    }
  }, { passive: true });

  var fabBtns = document.querySelectorAll('.mobile-fab__btn');
  fabBtns.forEach(function (btn) {
    var timer = null;
    function triggerTap() {
      btn.classList.add('is-tapped');
      clearTimeout(timer);
      timer = setTimeout(function () { btn.classList.remove('is-tapped'); }, 400);
    }
    btn.addEventListener('touchstart', triggerTap, { passive: true });
    btn.addEventListener('mousedown', triggerTap);
  });

  // 탭 이미지 사전 로드
  [_hfBase + 'img/quickbt_share_tab.png', _hfBase + 'img/quickbt_top_tab.png'].forEach(function (src) {
    var img = new Image();
    img.src = src;
  });
})();
