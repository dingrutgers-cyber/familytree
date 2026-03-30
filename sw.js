// 丁氏家谱 PWA Service Worker
const CACHE = 'ding-genealogy-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap'
];

// 安装时缓存核心资源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // 逐个缓存，单个失败不影响整体
      return Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

// 激活时清除旧缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：优先网络，网络失败回退缓存（数据始终最新）
self.addEventListener('fetch', e => {
  // Supabase API 请求不缓存，必须走网络
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 缓存成功响应的副本
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
