/**
 * soldout.js — 조기소진 on/off 설정
 * true  : 조기소진 오버레이 표시
 * false : 정상 표시
 */
var SOLDOUT = {
  mission01: false,  // 미션01 (1,000 미션 마일리지)
  mission02: false,  // 미션02 (SOL: enchant 특별 보상 패키지)
};

(function () {
  if (SOLDOUT.mission01) {
    var m1 = document.querySelector('#mission01 .mission-reward');
    if (m1) m1.classList.add('is-soldout');
  }
  if (SOLDOUT.mission02) {
    var m2 = document.querySelector('#mission02 .mission-reward__package');
    if (m2) m2.classList.add('is-soldout');
  }
})();
