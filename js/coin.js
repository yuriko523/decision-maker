/* ============================================
   🪙  掷硬币 (支持 1~3 枚，3D 厚度)
   ============================================ */
(function() {
  'use strict';

  const coinArea = document.getElementById('coin-area');
  const prompt = document.getElementById('coin-prompt');
  const resultDiv = document.getElementById('coin-result');
  const resultText = document.getElementById('coin-result-text');
  const flipBtn = document.getElementById('coin-flip-btn');
  const countBtns = document.querySelectorAll('#coin-count-selector .selector-btn');
  const wrappers = document.querySelectorAll('.coin-wrapper');

  let coinCount = 1;
  let isFlipping = false;

  const FACES = {
    0: { text: '正面 🪙', label: '正面' },
    1: { text: '反面 🌙', label: '反面' },
  };

  function updateCoinCount(count) {
    if (isFlipping) return;
    coinCount = count;

    countBtns.forEach(function(btn) {
      btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
    });

    wrappers.forEach(function(w, i) {
      w.classList.toggle('hidden', i >= count);
    });

    resultDiv.classList.remove('show');
    prompt.textContent = '轻触硬币，开始翻转';
    prompt.classList.remove('hidden');
  }

  function flipCoins() {
    if (isFlipping) return;
    isFlipping = true;

    resultDiv.classList.remove('show');
    prompt.classList.add('hidden');
    flipBtn.disabled = true;

    vibrate(15);

    const results = [];

    for (let i = 0; i < coinCount; i++) {
      const wrapper = wrappers[i];
      wrapper.classList.remove('hidden');
      const coin = wrapper.querySelector('.coin');

      const result = Math.random() < 0.5 ? 0 : 1;
      results.push(result);

      const turns = rand(5, 9);
      const targetAngle = result === 0 ? 0 : 180;
      const totalRotation = turns * 360 + targetAngle;

      // 归零
      coin.classList.remove('flipping');
      coin.style.transition = 'none';
      coin.style.transform = 'rotateY(0deg)';
      void wrapper.offsetHeight;

      // 翻转
      coin.classList.add('flipping');
      coin.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
      coin.style.transform = 'rotateY(' + totalRotation + 'deg)';
    }

    // 最后一场动画结束后显示结果
    var lastCoin = wrappers[coinCount - 1].querySelector('.coin');
    lastCoin.addEventListener('transitionend', function onEnd() {
      lastCoin.removeEventListener('transitionend', onEnd);

      // 所有硬币动画完成
      document.querySelectorAll('.coin.flipping').forEach(function(c) {
        c.classList.remove('flipping');
      });

      // 显示结果
      var parts = results.map(function(r) { return FACES[r].text; });
      var resultStr = parts.join(' · ');
      var sumText = coinCount > 1 ? ' (' + results.map(function(r) { return FACES[r].label; }).join(' + ') + ')' : '';

      resultText.textContent = resultStr;
      resultDiv.classList.add('show');
      prompt.textContent = '再轻触硬币翻转';
      prompt.classList.remove('hidden');
      flipBtn.disabled = false;
      isFlipping = false;
    }, { once: true });
  }

  // ---------- 事件绑定 ----------
  countBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      updateCoinCount(parseInt(btn.dataset.count));
    });
  });

  coinArea.addEventListener('click', function(e) {
    if (e.target.closest('.coin-wrapper:not(.hidden)')) {
      flipCoins();
    }
  });

  flipBtn.addEventListener('click', flipCoins);

  // ---------- 页面进入时重置 ----------
  document.addEventListener('pageenter', function(e) {
    if (e.detail.page === 'coin') {
      updateCoinCount(coinCount);
      resultDiv.classList.remove('show');
      prompt.textContent = '轻触硬币，开始翻转';
      prompt.classList.remove('hidden');
      flipBtn.disabled = false;
      isFlipping = false;

      document.querySelectorAll('.coin').forEach(function(c) {
        c.classList.remove('flipping');
        c.style.transition = 'none';
        c.style.transform = 'rotateY(0deg)';
      });
    }
  });

})();
