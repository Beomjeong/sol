(function () {
  var guide = document.getElementById('mission03');
  if (!guide) return;

  var tabs   = guide.querySelectorAll('.howto-tab');
  var panels = guide.querySelectorAll('.howto-panel');

  var imgMap = {
    pc:  { pc1:  'assets/pc1.jpg',  pc2:  'assets/pc2.jpg'  },
    ios: { ios1: 'assets/ios1.jpg', ios2: 'assets/ios2.jpg', ios3: 'assets/ios3.jpg' }
  };

  function defaultImg() {
    return window.innerWidth < 1024 ? 'assets/default_mo.jpg' : 'assets/default_pc.jpg';
  }

  function switchTab(targetId) {
    tabs.forEach(function (tab) {
      var active = tab.dataset.tab === targetId;
      tab.classList.toggle('is-active', active);
      tab.querySelector('.howto-tab__bg').src =
        active ? 'assets/tab_selected.png' : 'assets/tab_default.png';
    });

    panels.forEach(function (panel) {
      var active = panel.id === 'panel-' + targetId;
      panel.classList.toggle('is-active', active);
      if (active) {
        panel.querySelector('.howto-img').src = defaultImg();
      }
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { switchTab(this.dataset.tab); });
  });

  panels.forEach(function (panel) {
    var tabId = panel.id.replace('panel-', '');
    var img   = panel.querySelector('.howto-img');

    // 개별 스텝: 진입 시 이미지 교체
    panel.querySelectorAll('.howto-step').forEach(function (step) {
      step.addEventListener('mouseenter', function () {
        var key = this.dataset.img;
        if (imgMap[tabId][key]) img.src = imgMap[tabId][key];
      });
    });

    // 컨테이너 전체를 벗어날 때만 기본 이미지로 리셋
    var stepsContainer = panel.querySelector('.howto-steps');
    if (stepsContainer) {
      stepsContainer.addEventListener('mouseleave', function () {
        img.src = defaultImg();
      });
    }
  });

  // 초기 기본 이미지 설정 (뷰포트 크기에 맞게)
  var activePanel = guide.querySelector('.howto-panel.is-active');
  if (activePanel) {
    var initImg = activePanel.querySelector('.howto-img');
    if (initImg) initImg.src = defaultImg();
  }
})();
