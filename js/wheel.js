/* ============================================
   🎡  转盘
   ============================================ */
(function() {
  'use strict';

  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const optionList = document.getElementById('option-list');
  const hint = document.getElementById('option-hint');
  const addBtn = document.getElementById('wheel-add-option');
  const spinBtn = document.getElementById('wheel-spin-btn');
  const resultDiv = document.getElementById('wheel-result');
  const resultText = document.getElementById('wheel-result-text');

  let inputRow = null;

  // ---------- 状态 ----------
  let options = ['吃饭', '睡觉', '打豆豆'];
  let currentAngle = 0;        // 转盘旋转角度 (弧度)
  let isSpinning = false;
  let animFrameId = null;
  let velocity = 0;            // 角速度
  const FRICTION = 0.985;
  const MIN_VELOCITY = 0.003;

  // 逻辑分辨率固定 300x300
  const LOGICAL_SIZE = 300;

  // 预设配色
  const COLORS = [
    { h: 340, s: 80, l: 60 },
    { h: 200, s: 75, l: 55 },
    { h: 45,  s: 90, l: 55 },
    { h: 160, s: 60, l: 50 },
    { h: 280, s: 60, l: 60 },
    { h: 10,  s: 80, l: 55 },
    { h: 120, s: 50, l: 45 },
    { h: 320, s: 70, l: 55 },
  ];

  // ---------- Canvas 尺寸适配 ----------
  function setupCanvas() {
    const wrapper = canvas.parentNode;
    const containerW = wrapper.offsetWidth || 300;
    const maxH = window.innerHeight * 0.45;
    const displaySize = Math.min(containerW - 32, LOGICAL_SIZE, maxH);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = LOGICAL_SIZE * dpr;
    canvas.height = LOGICAL_SIZE * dpr;
    canvas.style.width = displaySize + 'px';
    canvas.style.height = displaySize + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 后续所有绘图使用 LOGICAL_SIZE 坐标系
  }

  // ---------- 绘制转盘 ----------
  function drawWheel() {
    const R = LOGICAL_SIZE / 2;
    const cx = R, cy = R;
    const radius = R - 8;
    const count = options.length;

    ctx.clearRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);

    if (count === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.font = '16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('添加选项开始', cx, cy);
      return;
    }

    const arcSize = (2 * Math.PI) / count;

    // 外圈光晕
    const glow = ctx.createRadialGradient(cx, cy, radius - 4, cx, cy, radius + 6);
    glow.addColorStop(0, 'rgba(255,255,255,0.06)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, 2 * Math.PI);
    ctx.fill();

    // 绘制每个扇形
    for (let i = 0; i < count; i++) {
      const startAngle = currentAngle + i * arcSize;
      const endAngle = startAngle + arcSize;

      const c = COLORS[i % COLORS.length];

      // 扇形
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = 'hsl(' + c.h + ', ' + c.s + '%, ' + c.l + '%)';
      ctx.fill();

      // 扇形边线
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 文字 — 水平居中于扇形中央
      const midAngle = startAngle + arcSize / 2;
      const textR = radius * 0.58;
      const tx = cx + Math.cos(midAngle) * textR;
      const ty = cy + Math.sin(midAngle) * textR;

      const text = options[i];
      const displayText = text.length > 5 ? text.slice(0, 4) + '…' : text;
      ctx.save();
      ctx.translate(tx, ty);
      // 不旋转，水平绘制，确保文字与对应颜色区域对应
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      var fontSize = count <= 4 ? 14 : count <= 6 ? 13 : 11;
      ctx.font = 'bold ' + fontSize + 'px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayText, 0, 0);
      ctx.restore();
    }

    // 中心装饰圆
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    grad.addColorStop(0, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ---------- 物理旋转动画 ----------
  function spinWheel() {
    if (isSpinning) return;
    if (options.length < 2) {
      showModal('⚠️', '选项不足', '至少需要 2 个选项才能转起来');
      return;
    }

    isSpinning = true;
    resultDiv.classList.remove('show');
    spinBtn.disabled = true;
    addBtn.disabled = true;

    vibrate(15);

    // 随机初始速度 (0.4 ~ 0.7)
    velocity = 0.4 + Math.random() * 0.3;
    if (Math.random() > 0.5) velocity = -velocity;

    const minRotation = (3 + Math.random() * 2) * 2 * Math.PI;
    let totalRotation = 0;

    function animate() {
      if (Math.abs(velocity) < MIN_VELOCITY && totalRotation > minRotation) {
        velocity = 0;
        isSpinning = false;
        spinBtn.disabled = false;
        addBtn.disabled = false;
        cancelAnimationFrame(animFrameId);
        onSpinEnd();
        return;
      }

      currentAngle += velocity;
      totalRotation += Math.abs(velocity);
      velocity *= FRICTION;

      // 保持最低速度直到完成最小圈数
      if (Math.abs(velocity) < MIN_VELOCITY && totalRotation < minRotation) {
        velocity = (velocity > 0 ? 1 : -1) * MIN_VELOCITY;
      }

      drawWheel();
      animFrameId = requestAnimationFrame(animate);
    }

    animFrameId = requestAnimationFrame(animate);
  }

  function onSpinEnd() {
    const count = options.length;
    const arcSize = (2 * Math.PI) / count;
    // 指针在 12 点方向 = -π/2
    const pointerAngle = -Math.PI / 2;

    let angleFromStart = (pointerAngle - currentAngle) % (2 * Math.PI);
    if (angleFromStart < 0) angleFromStart += 2 * Math.PI;

    const idx = Math.floor(angleFromStart / arcSize) % count;
    const chosen = options[idx];

    vibrate(30);

    resultText.textContent = '🎉 ' + chosen;
    resultDiv.classList.add('show');

    setTimeout(function() {
      showModal('🎡', '选到了！', chosen);
    }, 400);
  }

  // ---------- 选项管理 ----------
  function renderOptions() {
    optionList.innerHTML = '';
    if (options.length === 0) {
      hint.classList.remove('hidden');
    } else {
      hint.classList.add('hidden');
    }

    options.forEach(function(opt, i) {
      const tag = document.createElement('span');
      tag.className = 'option-tag';
      tag.innerHTML = ''
        + '<span class="option-dot" style="background:hsl('
        + COLORS[i % COLORS.length].h + ','
        + COLORS[i % COLORS.length].s + '%,'
        + COLORS[i % COLORS.length].l + '%)"></span>'
        + '<span class="option-text">' + escapeHtml(opt) + '</span>'
        + '<button class="option-remove" data-index="' + i + '">✕</button>';
      optionList.appendChild(tag);

      tag.querySelector('.option-remove').addEventListener('click', function() {
        options.splice(i, 1);
        renderOptions();
        drawWheel();
        resultDiv.classList.remove('show');
      });
    });

    drawWheel();
  }

  function showInputRow() {
    if (inputRow) return;
    if (options.length >= 8) {
      showModal('⚠️', '选项已达上限', '最多支持 8 个选项');
      return;
    }

    inputRow = document.createElement('div');
    inputRow.className = 'option-input-row';
    inputRow.innerHTML = ''
      + '<input type="text" id="option-input" placeholder="输入选项…" maxlength="20">'
      + '<button class="tiny-btn" id="option-confirm">确定</button>'
      + '<button class="tiny-btn" id="option-cancel">取消</button>';

    optionList.parentNode.insertBefore(inputRow, optionList.nextSibling);
    const input = document.getElementById('option-input');
    input.focus();

    document.getElementById('option-confirm').addEventListener('click', confirmAdd);
    document.getElementById('option-cancel').addEventListener('click', cancelAdd);

    input.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter') confirmAdd();
      if (e.key === 'Escape') cancelAdd();
    });
  }

  function confirmAdd() {
    const input = document.getElementById('option-input');
    const val = input.value.trim();
    if (!val) return;

    if (options.length >= 8) {
      showModal('⚠️', '选项已达上限', '最多支持 8 个选项');
      return;
    }
    if (options.indexOf(val) !== -1) {
      showModal('⚠️', '选项重复', '已有相同的选项');
      return;
    }

    options.push(val);
    renderOptions();
    resultDiv.classList.remove('show');
    removeInputRow();
  }

  function cancelAdd() {
    removeInputRow();
  }

  function removeInputRow() {
    if (inputRow) {
      inputRow.parentNode.removeChild(inputRow);
      inputRow = null;
    }
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ---------- 事件绑定 ----------
  addBtn.addEventListener('click', showInputRow);
  spinBtn.addEventListener('click', spinWheel);

  // ---------- 页面进入 ----------
  document.addEventListener('pageenter', function(e) {
    if (e.detail.page === 'wheel') {
      removeInputRow();
      setupCanvas();
      renderOptions();
      resultDiv.classList.remove('show');
      spinBtn.disabled = false;
      addBtn.disabled = false;
      isSpinning = false;
      if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
      velocity = 0;
      currentAngle = 0;
    }
  });

  window.addEventListener('resize', function() {
    if (document.getElementById('page-wheel').classList.contains('active')) {
      setupCanvas();
      drawWheel();
    }
  });

})();
