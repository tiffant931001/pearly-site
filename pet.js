// 首頁角色:直接使用 Pearly App 的 char13.js(動作、待機輪播、點擊跳、連點頭暈都在裡面)
// 這支只負責:把角色放進角色卡、長按施魔法、太久沒點就睡覺、睡一下自己起床、睡覺時變紫色
(function () {
  var card = document.querySelector('.character-card');
  if (!card) return;

  var DOZE_AFTER = 20 * 1000;      // 20 秒沒人點 → 開始打盹（粉紅底,不變紫）
  var NIGHT_AFTER = 60 * 1000;     // 1 分鐘沒人點 → 戴粉色睡帽睡覺（背景變紫）
  var NAP_LENGTH = 30 * 1000;      // 睡著 30 秒後自己起床
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

  // ---------- 睡覺流程:20 秒打盹 → 2 分鐘戴睡帽(變紫) → 睡 30 秒自己起床 ----------
  setInterval(function () {
    if (!window.PC || document.hidden) return;
    var s = PC.state();
    var idle = Date.now() - lastTouch;

    // 只有真的戴睡帽睡覺時,角色卡才變紫色(打盹維持粉紅)
    card.classList.toggle('sleep', s.sleeping === 'night');

    // 1) 已經戴睡帽睡著 → 30 秒後自己醒
    if (s.sleeping === 'night') {
      if (!sleptAt) sleptAt = Date.now();
      if (Date.now() - sleptAt >= NAP_LENGTH) {
        PC.wakeQuiet();          // 悄悄醒(不出現「被吵醒」表情)
        PC.react('greet');       // 醒來打招呼
        lastTouch = Date.now();
        sleptAt = 0;
      }
      return;
    }

    // 2) 正在打盹 → 沒人點滿 2 分鐘就戴上睡帽
    if (s.sleeping === 'doze') {
      sleptAt = 0;
      if (idle >= NIGHT_AFTER && !s.busy) PC.night(false);
      return;
    }

    // 3) 動畫中(待機、點擊、長按施魔法)不要打斷
    if (s.busy || s.lpOn) return;

    // 4) 20 秒沒人點 → 開始打盹
    sleptAt = 0;
    if (idle >= DOZE_AFTER) PC.doze();
  }, 1000);

  // 載入 App 的角色
  var s = document.createElement('script');
  s.src = 'char13.js';
  document.head.appendChild(s);
})();
