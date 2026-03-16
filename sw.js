
const CACHE_NAME = 'zen-chant-v10'; 
const AUDIO_CACHE = 'zen-chant-audio';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME && key !== AUDIO_CACHE) return caches.delete(key);
      })
    )).then(() => clients.claim())
  );
});

/**
 * 模拟 206 Partial Content
 * 解决移动端浏览器在离线状态下无法通过 Range 请求读取缓存音频的问题
 */
async function getRangeResponse(request, cachedResponse) {
  if (!cachedResponse || cachedResponse.status !== 200) {
    return cachedResponse;
  }

  const rangeHeader = request.headers.get('Range');
  if (!rangeHeader) return cachedResponse;

  try {
    const arrayBuffer = await cachedResponse.arrayBuffer();
    const bytes = rangeHeader.match(/^bytes=(\d+)-(\d+)?$/);
    if (!bytes) return cachedResponse;

    const start = parseInt(bytes[1], 10);
    const total = arrayBuffer.byteLength;
    const end = bytes[2] ? parseInt(bytes[2], 10) : total - 1;

    const chunk = arrayBuffer.slice(start, end + 1);
    
    const responseHeaders = new Headers(cachedResponse.headers);
    responseHeaders.set('Content-Range', `bytes ${start}-${end}/${total}`);
    responseHeaders.set('Content-Length', chunk.byteLength.toString());
    responseHeaders.set('Accept-Ranges', 'bytes');
    
    // 如果没有 Content-Type，默认为音频
    if (!responseHeaders.has('Content-Type')) {
      responseHeaders.set('Content-Type', 'audio/mpeg');
    }

    return new Response(chunk, {
      status: 206,
      statusText: 'Partial Content',
      headers: responseHeaders
    });
  } catch (err) {
    console.warn('[SW] Range processing failed, falling back to full response:', err);
    return cachedResponse;
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 拦截音频请求
  if (url.hostname.includes('jdcloud-oss.com') || url.pathname.endsWith('.mp3')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(AUDIO_CACHE);
        const cachedResponse = await cache.match(event.request.url, { 
          ignoreSearch: true 
        });

        if (cachedResponse) {
          return getRangeResponse(event.request, cachedResponse);
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            cache.put(event.request.url, cacheCopy);
          }
          return networkResponse;
        } catch (err) {
          return new Response(null, { status: 503 });
        }
      })()
    );
    return;
  }

  // 静态资源：Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((res) => {
      const fetchPromise = fetch(event.request).then((networkRes) => {
        if (event.request.method === 'GET' && networkRes.status === 200) {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
        }
        return networkRes;
      }).catch(() => null);
      return res || fetchPromise;
    })
  );
});
