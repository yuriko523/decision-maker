/* ============================================
   🎲  摇骰子
   ============================================ */
(function() {
  'use strict';

  const diceArea = document.getElementById('dice-area');
  const prompt = document.getElementById('dice-prompt');
  const resultDiv = document.getElementById('dice-result');
  const resultText = document.getElementById('dice-result-text');
  const rollBtn = document.getElementById('dice-roll-btn');
  const countBtns = document.querySelectorAll('#dice-count-selector .selector-btn');
  const wrappers = document.querySelectorAll('.dice-wrapper');

  let diceCount = 1;
  let isRolling = false;

  // 每个骰子面对应的旋转角度 (rotateX, rotateY)
  // 为了让目标面朝前 (Z正方向)
  const FACE_ROTATIONS = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: 90 },
    6: { x: 180, y: 0 },
  };

  function updateDiceCount(count) {
    if (isRolling) return;
    diceCount = count;

    // 更新按钮状态
    countBtns.forEach(function(btn) {
      btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
    });

    // 显示/隐藏骰子
    wrappers.forEach(function(w, i) {
      w.classList.toggle('hidden', i >= count);
    });

    // 重置结果
    resultDiv.classList.remove('show');
    prompt.textContent = '轻触骰子，开始投掷';
    prompt.classList.remove('hidden');
  }

  function rollDice() {
    if (isRolling) return;
    isRolling = true;

    resultDiv.classList.remove('show');
    prompt.classList.add('hidden');
    rollBtn.disabled = true;

    vibrate(20);

    const results = [];
    const diceEls = [];

    for (let i = 0; i < diceCount; i++) {
      const wrapper = wrappers[i];
      wrapper.classList.remove('hidden');
      const dice = wrapper.querySelector('.dice');
      diceEls.push(dice);

      const result = rand(1, 6);
      results.push(result);

      const rot = FACE_ROTATIONS[result];
      // 随机多圈旋转 (3~6圈)
      const turnsX = rand(3, 6);
      const turnsY = rand(3, 6);
      // 加上目标角度偏移
      const totalX = turnsX * 360 + rot.x;
      const totalY = turnsY * 360 + rot.y;

      // 归零
      dice.style.transition = 'none';
      dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
      void dice.offsetWidth;

      // 滚动动画
      dice.classList.add('rolling');
      dice.style.transition = 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)';
      dice.style.transform = 'rotateX(' + totalX + 'deg) rotateY(' + totalY + 'deg)';
    }

    // 等所有骰子动画完成 (取最长的时间)
    setTimeout(function() {
      diceEls.forEach(function(d) { d.classList.remove('rolling'); });

      // 显示结果
      const resultStr = results.join(' · ');
      const sum = results.reduce(function(a, b) { return a + b; }, 0);
      const display = diceCount > 1
        ? results.join(' + ') + ' = ' + sum
        : resultStr;

      resultText.textContent = '🎲 ' + display;
      resultDiv.classList.add('show');
      prompt.textContent = '再轻触骰子投掷';
      prompt.classList.remove('hidden');
      rollBtn.disabled = false;
      isRolling = false;
    }, 1000);
  }

  // ---------- 事件绑定 ----------
  countBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      updateDiceCount(parseInt(btn.dataset.count));
    });
  });

  // 点击骰子触发
  diceArea.addEventListener('click', function(e) {
    // 只在实际显示的骰子上触发
    if (e.target.closest('.dice-wrapper:not(.hidden)')) {
      rollDice();
    }
  });

  rollBtn.addEventListener('click', rollDice);

  // ---------- 页面进入时重置 ----------
  document.addEventListener('pageenter', function(e) {
    if (e.detail.page === 'dice') {
      updateDiceCount(diceCount);
      resultDiv.classList.remove('show');
      prompt.textContent = '轻触骰子，开始投掷';
      prompt.classList.remove('hidden');
      rollBtn.disabled = false;
      isRolling = false;

      // 重置骰子旋转
      document.querySelectorAll('.dice').forEach(function(d) {
        d.style.transition = 'none';
        d.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    }
  });

})();
