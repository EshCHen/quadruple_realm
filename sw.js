/* 四分境域 · 世界档案 —— Service Worker
   策略：同源资源「网络优先 + 缓存兜底」，保证联网时永远是最新版，断网时仍可翻阅。
   跨域请求（Supabase）与数据接口不拦截，避免把留言板缓存成旧数据。 */

const CACHE = "qr-archive-v1";
const SHELL = [
  "./",
  "./index.html",
  "./archive.data.json",
  "./manifest.webmanifest",
  "./assets/pwa/icon.svg"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(
      SHELL.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))
    ))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;          // 跨域直连（Supabase 等）
  if (url.pathname.indexOf("/rest/v1/") !== -1) return;     // 数据接口不缓存

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined)
        )
      )
  );
});
