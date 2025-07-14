// 🚀 SERVICE WORKER OPTIMISÉ - Version 2.0
const CACHE_NAME = 'video-downloader-v2';
const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Ressources à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Ressources à mettre en cache dynamiquement
const DYNAMIC_ASSETS = [
  '/server.js',
  '/api/'
];

// Durée de cache pour différents types de ressources
const CACHE_STRATEGIES = {
  images: 86400000, // 24 heures
  fonts: 604800000, // 7 jours
  css: 86400000, // 24 heures
  js: 3600000, // 1 heure
  api: 300000, // 5 minutes
  html: 0 // Pas de cache pour HTML
};

// 📦 INSTALLATION DU SERVICE WORKER
self.addEventListener('install', event => {
  console.log('🔧 Installation du service worker v2.0');
  
  event.waitUntil(
    Promise.all([
      // Cache des ressources statiques
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Mise en cache des ressources statiques');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting pour activer immédiatement
      self.skipWaiting()
    ])
  );
});

// 🔄 ACTIVATION DU SERVICE WORKER
self.addEventListener('activate', event => {
  console.log('✅ Activation du service worker v2.0');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Prendre le contrôle de tous les clients
      self.clients.claim()
    ])
  );
});

// 🌐 INTERCEPTION DES REQUÊTES
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes Chrome extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Stratégies de cache selon le type de ressource
  if (url.pathname.startsWith('/api/')) {
    // API - Cache First avec fallback réseau
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url)) {
    // Ressources statiques - Cache First
    event.respondWith(handleStaticRequest(request));
  } else if (isHTML(url)) {
    // HTML - Network First avec fallback cache
    event.respondWith(handleHTMLRequest(request));
  } else {
    // Autres ressources - Cache First avec fallback réseau
    event.respondWith(handleDynamicRequest(request));
  }
});

// 📱 GESTION DES REQUÊTES API
async function handleApiRequest(request) {
  try {
    // Essayer le réseau d'abord
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Mettre en cache la réponse
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Fallback sur le cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse();
    
  } catch (error) {
    console.log('❌ Erreur réseau API:', error);
    
    // Fallback sur le cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse();
  }
}

// 🎨 GESTION DES RESSOURCES STATIQUES
async function handleStaticRequest(request) {
  try {
    // Vérifier d'abord le cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Vérifier si le cache est encore valide
      const cacheTime = parseInt(cachedResponse.headers.get('sw-cache-time'));
      const now = Date.now();
      const maxAge = getCacheMaxAge(request.url);
      
      if (cacheTime && (now - cacheTime) < maxAge) {
        return cachedResponse;
      }
    }
    
    // Essayer le réseau
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Mettre en cache avec timestamp
      const cache = await caches.open(STATIC_CACHE);
      const responseClone = networkResponse.clone();
      
      // Ajouter timestamp au header
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const cachedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
      return networkResponse;
    }
    
    // Fallback sur le cache même périmé
    return cachedResponse || createOfflineResponse();
    
  } catch (error) {
    console.log('❌ Erreur réseau statique:', error);
    
    // Fallback sur le cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse();
  }
}

// 📄 GESTION DES PAGES HTML
async function handleHTMLRequest(request) {
  try {
    // Réseau d'abord pour le HTML
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Mettre en cache
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Réponse réseau non valide');
    
  } catch (error) {
    console.log('❌ Erreur réseau HTML:', error);
    
    // Fallback sur le cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/index.html') || createOfflineResponse();
  }
}

// 🔄 GESTION DES REQUÊTES DYNAMIQUES
async function handleDynamicRequest(request) {
  try {
    // Cache d'abord
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Mise à jour en arrière-plan
      fetchAndUpdateCache(request);
      return cachedResponse;
    }
    
    // Sinon, réseau
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Mettre en cache
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    return createOfflineResponse();
    
  } catch (error) {
    console.log('❌ Erreur réseau dynamique:', error);
    return createOfflineResponse();
  }
}

// 🔄 MISE À JOUR DU CACHE EN ARRIÈRE-PLAN
async function fetchAndUpdateCache(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
  } catch (error) {
    console.log('❌ Erreur mise à jour cache:', error);
  }
}

// 🛠️ FONCTIONS UTILITAIRES
function isStaticAsset(url) {
  return url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.ttf') ||
         url.pathname.includes('font-awesome') ||
         url.pathname.includes('googleapis');
}

function isHTML(url) {
  return url.pathname.endsWith('.html') ||
         url.pathname === '/' ||
         (!url.pathname.includes('.') && !url.pathname.startsWith('/api/'));
}

function getCacheMaxAge(url) {
  if (url.includes('font') || url.includes('woff')) {
    return CACHE_STRATEGIES.fonts;
  } else if (url.includes('.css')) {
    return CACHE_STRATEGIES.css;
  } else if (url.includes('.js')) {
    return CACHE_STRATEGIES.js;
  } else if (url.includes('api/')) {
    return CACHE_STRATEGIES.api;
  } else {
    return CACHE_STRATEGIES.images;
  }
}

function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: 'Vous êtes hors ligne',
      message: 'Cette fonctionnalité nécessite une connexion Internet'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// 💾 NETTOYAGE AUTOMATIQUE DU CACHE
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const cacheTime = parseInt(response.headers.get('sw-cache-time'));
      
      if (cacheTime) {
        const maxAge = getCacheMaxAge(request.url);
        if (Date.now() - cacheTime > maxAge) {
          await cache.delete(request);
        }
      }
    }
  }
}

// 📧 GESTION DES MESSAGES
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEANUP_CACHE':
      cleanupOldCaches();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('❓ Message non reconnu:', type);
  }
});

// 📊 STATUT DU CACHE
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    status[cacheName] = requests.length;
  }
  
  return status;
}

// 🗑️ VIDER TOUS LES CACHES
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// 🔄 SYNCHRONISATION EN ARRIÈRE-PLAN
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Synchroniser les données hors ligne
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  // Synchroniser les téléchargements en attente
  const offlineData = await getOfflineData();
  
  for (const item of offlineData) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      
      // Supprimer l'élément synchronisé
      await removeOfflineData(item.id);
      
    } catch (error) {
      console.log('❌ Erreur synchronisation:', error);
    }
  }
}

// 📱 NOTIFICATIONS PUSH
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: '/icon-72x72.png',
        actions: data.actions || []
      })
    );
  }
});

// 🔔 CLIC SUR NOTIFICATION
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 🧹 NETTOYAGE PÉRIODIQUE
setInterval(cleanupOldCaches, 3600000); // Chaque heure

console.log('🚀 Service Worker v2.0 initialisé avec succès'); 