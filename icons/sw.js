/* QUADRUPLE OS · Service Worker
   仅用于满足 PWA 安装条件，不缓存任何内容（保证始终即时更新）。 */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', function (e) { /* 走网络，不拦截 */ });
