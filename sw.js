// Virtual Card Maker Service Worker
const CACHE_NAME = 'virtual-card-maker-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './public/icons/icon-192.png',
  './public/icons/icon-512.png',
  './public/icons/maskable-192.png',
  './public/icons/maskable-512.png',
  './public/icons/apple-touch-icon.png',
  './public/icons/favicon-16.png',
  './public/icons/favicon-32.png',
  './public/icons/favicon.ico',
  './skill.json',
  './webmcp.json',
  './webmcp-example.html',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Only cache local assets, external CDN resources may fail
        return cache.addAll([
          './',
          './index.html',
          './manifest.webmanifest',
          './public/icons/icon-192.png',
          './public/icons/icon-512.png',
          './public/icons/maskable-192.png',
          './public/icons/maskable-512.png',
          './public/icons/apple-touch-icon.png',
          './public/icons/favicon-16.png',
          './public/icons/favicon-32.png',
          './public/icons/favicon.ico',
          './skill.json',
          './webmcp.json',
          './webmcp-example.html'
        ]).catch(err => console.log('[Service Worker] Cache add error:', err));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (requestUrl.pathname.endsWith('/api/webmcp') && request.method === 'POST') {
    event.respondWith(handleWebMcpApi(request));
    return;
  }

  // Skip cross-origin requests
  if (!request.url.includes(self.location.origin) && !request.url.includes('cdnjs') && !request.url.includes('unpkg')) {
    return;
  }

  // For navigation requests, try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => response || caches.match('./index.html'));
        })
    );
    return;
  }

  // For other requests, use cache first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseToCache));
            return response;
          })
          .catch(() => {
            console.log('[Service Worker] Fetch failed, returning offline response');
            return new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

async function handleWebMcpApi(request) {
  try {
    const body = await request.clone().json();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body?.id || null,
        error: { code: -32001, message: 'No active page client to handle WebMCP request' }
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const activeClient = clients[0];
    const responsePayload = await callClientWebMcp(activeClient, {
      id: body?.id || Date.now(),
      payload: body,
      origin: request.headers.get('origin') || self.location.origin
    });

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse/Dispatch error: ${String(error)}` }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function callClientWebMcp(client, requestPayload) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => {
      resolve({
        jsonrpc: '2.0',
        id: requestPayload.id,
        error: { code: -32002, message: 'WebMCP bridge timeout' }
      });
    }, 7000);

    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data);
    };

    client.postMessage({
      type: 'WEB_MCP_HTTP_REQUEST',
      ...requestPayload
    }, [channel.port2]);
  });
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
