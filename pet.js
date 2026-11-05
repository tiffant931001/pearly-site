// 首頁角色:直接使用 Pearly App 的 char13.js(動作、待機輪播、點擊跳、連點頭暈都在裡面)
// 這支只負責:把角色放進角色卡、長按施魔法、太久沒點就睡覺、睡一下自己起床、睡覺時變紫色
(function () {
  var card = document.querySelector('.character-card');
  if (!card) return;

  var SLEEP_AFTER = 3 * 60 * 1000; // 3 分鐘沒點就睡著
  var NAP_LENGTH = 30 * 1000;      // 睡 30 秒後自己起床
  var HOLD = 450;                  // 按住 0.45 秒算長按(跟 App 一樣)

  var lastTouch = Date.now();
  var sleptAt = 0;

  // char13.js 載入完成後會呼叫這兩個
  window.PCready = function () {
    PC.mount(card.querySelector('.pet'));
  };
  window.PCtouch = function () {
    lastTouch = Date.now();
  };

  // ---------- 長按:施魔法,放開回到原狀 ----------
  var timer = null, x0 = 0, y0 = 0, holding = false, fired = false;

  card.addEventListener('pointerdown', function (e) {
    x0 = e.clientX; y0 = e.clientY; fired = false;
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!window.PC) return;
      if (PC.state().sleeping) PC.wakeQuiet();
      fired = true; holding = true;
      card.classList.add('lp-on');
      lastTouch = Date.now();
      PC.gather();
    }, HOLD);
  });

  document.addEventListener('pointermove', function (e) {
    if (timer && !holding && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) {
      clearTimeout(timer); timer = null;
    }
  });

  function release() {
    clearTimeout(timer); timer = null;
    if (holding) {
      holding = false;
      card.classList.remove('lp-on');
      PC.cancel();
      lastTouch = Date.now();
    }
  }
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);

  // 長按放開後不要再算成「點一下」
  card.addEventListener('click', function (e) {
    if (fired) { e.stopImmediatePropagation(); fired = false; }
  }, true);
  card.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------- 睡覺:每秒檢查一次 ----------
  setInterval(function () {
    if (!window.PC || document.hidden) return;
    var s = PC.state();
    var asleep = !!s.sleeping || s.act === 'doze';
    card.classList.toggle('sleep', asleep);

    if (!s.sleeping) {
      sleptAt = 0;
      if (Date.now() - lastTouch >= SLEEP_AFTER && !s.busy && !s.lpOn) PC.doze();
    } else {
      if (!sleptAt) sleptAt = Date.now();
      if (Date.now() - sleptAt >= NAP_LENGTH) {
        PC.wakeQuiet();          // 自己起床
        PC.react('greet');       // 起床打招呼
        lastTouch = Date.now();
        sleptAt = 0;
      }
    }
  }, 1000);

  // 載入 App 的角色
  var s = document.createElement('script');
  s.src = 'char13.js';
  document.head.appendChild(s);
})();
