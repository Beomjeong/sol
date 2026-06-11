(function () {
  var guide = document.getElementById('mission03');
  if (!guide) return;

  var tabs   = guide.querySelectorAll('.howto-tab');
  var panels = guide.querySelectorAll('.howto-panel');

  var imgMap = {
    pc:  { default: 'assets/default_pc.jpg', pc1:  'assets/pc1.jpg',  pc2:  'assets/pc2.jpg'  },
    ios: { default: 'assets/default_pc.jpg', ios1: 'assets/ios1.jpg', ios2: 'assets/ios2.jpg', ios3: 'assets/ios3.jpg' }
  };

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
        panel.querySelector('.howto-img').src = imgMap[targetId].default;
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
        img.src = imgMap[tabId].default;
      });
    }
  });
})();
