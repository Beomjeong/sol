(function () {
  'use strict';

  var sec = document.getElementById('sec03');
  if (!sec) return;

  var tabs   = sec.querySelectorAll('.how-tab');
  var panels = sec.querySelectorAll('.how-panel');

  function switchTab(targetId) {
    tabs.forEach(function (tab) {
      var active = tab.dataset.tab === targetId;
      tab.classList.toggle('is-active', active);
      tab.querySelector('.how-tab__bg').src =
        active ? 'assets/tab_selected.png' : 'assets/tab_default.png';
    });

    panels.forEach(function (panel) {
      panel.classList.toggle('is-active', panel.id === 'how-panel-' + targetId);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { switchTab(this.dataset.tab); });
  });
})();
