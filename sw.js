self.addEventListener("install", () => self.skipWaiting());

// 過去のオフライン用キャッシュを削除し、今後は常にネットワーク上の最新版を使う。
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
  );
});
