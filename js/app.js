/* ============================================
   简易决策器 PWA — 路由 + 共享
   ============================================ */

(function() {
  'use strict';

  // ---------- Hash Router ----------
  const pages = document.querySelectorAll('.page');
  const modalOverlay = document.getElementById('modal-overlay');
  let currentPage = 'home';
  let isTransitioning = false;

  function navigateTo(hash) {
    const target = hash.replace('#', '') || 'home';
    if (target === currentPage || isTransitioning) return;
    isTransitioning = true;

    const currentEl = document.getElementById('page-' + currentPage);
    const targetEl = document.getElementById('page-' + target);
    if (!targetEl) { isTransitioning = false; return; }

    // 离开当前页
    if (currentEl) {
      currentEl.classList.remove('active');
    }

    // 进入目标页
    targetEl.classList.add('active');
    currentPage = target;

    // 触发对应模块的 enter 钩子
    const event = new CustomEvent('pageenter', { detail: { page: target } });
    document.dispatchEvent(event);

    setTimeout(() => { isTransitioning = false; }, 400);
  }

  window.addEventListener('hashchange', () => navigateTo(location.hash));
  window.addEventListener('load', () => navigateTo(location.hash));

  // 拦截 data-nav 链接点击（支持 SPA 导航）
  document.addEventListener('click', function(e) {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      if (href === '#home' && currentPage === 'home') return;
      location.hash = href;
    }
  });

  // ---------- Modal ----------
  function showModal(icon, title, body) {
    document.getElementById('modal-icon').textContent = icon || '✨';
    document.getElementById('modal-title').textContent = title || '';
    document.getElementById('modal-body').textContent = body || '';
    modalOverlay.classList.add('show');
  }

  window.showModal = showModal;

  document.getElementById('modal-close').addEventListener('click', function() {
    modalOverlay.classList.remove('show');
  });

  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('show');
    }
  });

  // ---------- 振动反馈 ----------
  function vibrate(ms) {
    if (navigator.vibrate) {
      navigator.vibrate(ms || 10);
    }
  }
  window.vibrate = vibrate;

  // ---------- PWA: Service Worker ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('sw.js').catch(function(err) {
        console.log('SW 注册失败（可忽略）:', err);
      });
    });
  }

  // ---------- 工具函数 ----------
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  window.rand = rand;
  window.currentPage = () => currentPage;

})();
