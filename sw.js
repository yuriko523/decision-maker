/* ============================================
   简易决策器 PWA — Service Worker
   Cache-First 策略
   ============================================ */

const CACHE_NAME = 'decision-maker-v1';

// 缓存的资源
const CACHE_URLS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/coin.js',
  '/js/dice.js',
  '/js/wheel.js',
  '/manifest.json'
];

// 安装：预缓存核心资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// 请求：Cache-First，网络失败时回退到缓存
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      return fetch(event.request).then(function(response) {
        // 缓存成功获取的响应（只缓存同源资源）
        if (response && response.status === 200
            && event.request.url.startsWith(self.location.origin)
            && event.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
