const CACHE_NAME = 'mai-app-v1';
const BASE_PATH = '/mai-app';

// 캐시할 파일들
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  // 이 파일들은 빌드 후 정확한 경로로 업데이트 필요
];

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Cache addAll failed:', error);
      })
  );
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  // GitHub Pages 환경에서만 동작
  if (event.request.url.includes('/mai-app/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 캐시에 있으면 캐시된 버전 반환
          if (response) {
            return response;
          }
          
          // 캐시에 없으면 네트워크에서 가져오기
          return fetch(event.request).then((response) => {
            // 유효한 응답인지 확인
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 응답을 복제하여 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }).catch(() => {
            // 네트워크 실패시 오프라인 페이지 또는 기본 응답
            if (event.request.destination === 'document') {
              return caches.match(`${BASE_PATH}/index.html`);
            }
          });
        })
    );
  }
});

// 푸시 알림 처리 (선택사항)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'No payload',
    icon: `${BASE_PATH}/icons/icon-192x192.png`,
    badge: `${BASE_PATH}/icons/icon-72x72.png`,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '앱 열기',
        icon: `${BASE_PATH}/icons/icon-192x192.png`
      },
      {
        action: 'close',
        title: '닫기',
        icon: `${BASE_PATH}/icons/icon-192x192.png`
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('자동차 받아쓰기', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(`${BASE_PATH}/`)
    );
  }
});
