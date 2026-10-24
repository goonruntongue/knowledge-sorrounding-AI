// 常に最新を取りに行く Service Worker（キャッシュは持たない）。
// 画像・CSS・JS などは、通信エラーやサーバーの一時的なエラー（5xx）のとき、少し待って最大2回取り直す。
// ページ（HTML）の読み込みは1回だけで、取り直さない。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).then(() => self.clients.claim())));

const RETRY_WAITS = [400, 1200];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(request) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(request, { cache: 'reload' });
      if (response.status < 500 || attempt >= RETRY_WAITS.length) return response;
    } catch (error) {
      if (attempt >= RETRY_WAITS.length) throw error;
    }
    await wait(RETRY_WAITS[attempt]);
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'reload' }));
    return;
  }
  event.respondWith(fetchWithRetry(request));
});
