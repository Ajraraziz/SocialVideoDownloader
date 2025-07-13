// Éléments DOM
const platformButtons = document.querySelectorAll('.platform-btn');
const videoUrlInput = document.getElementById('videoUrl');
const downloadBtn = document.getElementById('downloadBtn');
const historyList = document.getElementById('historyList');
const loadingModal = document.getElementById('loadingModal');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

// Variables globales
let selectedPlatform = 'youtube';
let downloadHistory = JSON.parse(localStorage.getItem('downloadHistory')) || [];
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let isLandscape = window.innerWidth > window.innerHeight;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupMobileOptimizations();
});

function initializeApp() {
    // Charger l'historique
    loadDownloadHistory();
    
    // Événements
    setupEventListeners();
    
    // Détection automatique de la plateforme
    videoUrlInput.addEventListener('input', detectPlatform);
}

function setupMobileOptimizations() {
    // Détection de l'orientation
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    
    // Gestion du clavier virtuel sur mobile
    if (isMobile) {
        setupMobileKeyboardHandling();
        setupTouchOptimizations();
    }
    
    // Amélioration de la performance sur mobile
    if (isMobile) {
        optimizeForMobile();
    }
    
    // Enregistrement du service worker pour PWA
    registerServiceWorker();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker enregistré avec succès:', registration.scope);
                    
                    // Gérer les mises à jour du service worker
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('Échec de l\'enregistrement du Service Worker:', error);
                });
        });
        
        // Gérer les mises à jour
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Nouveau Service Worker activé');
        });
    }
}

function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'notification update-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 16px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideIn 0.3s ease;
        text-align: center;
        font-size: 14px;
    `;
    
    notification.innerHTML = `
        <div style="margin-bottom: 10px;">
            <i class="fas fa-sync-alt"></i> Nouvelle version disponible
        </div>
        <button onclick="updateApp()" 
                style="background: white; color: #2196F3; border: none; 
                       padding: 8px 16px; border-radius: 6px; cursor: pointer; 
                       font-weight: 600; margin-right: 10px;">
            Mettre à jour
        </button>
        <button onclick="this.parentElement.remove()" 
                style="background: rgba(255,255,255,0.2); color: white; border: none; 
                       padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            Plus tard
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 30 secondes
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 30000);
}

function updateApp() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        });
    }
}

function setupMobileKeyboardHandling() {
    // Éviter le zoom sur iOS lors de la saisie
    videoUrlInput.addEventListener('focus', function() {
        if (isMobile) {
            setTimeout(() => {
                window.scrollTo(0, 0);
                document.body.scrollTop = 0;
            }, 100);
        }
    });
    
    // Gérer la fermeture du clavier
    videoUrlInput.addEventListener('blur', function() {
        if (isMobile) {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 300);
        }
    });
}

function setupTouchOptimizations() {
    // Améliorer les interactions tactiles
    const touchElements = document.querySelectorAll('.platform-btn, .download-btn, .quality-option');
    
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.98)';
            this.style.opacity = '0.8';
        });
        
        element.addEventListener('touchend', function(e) {
            this.style.transform = '';
            this.style.opacity = '';
        });
        
        element.addEventListener('touchcancel', function(e) {
            this.style.transform = '';
            this.style.opacity = '';
        });
    });
}

function optimizeForMobile() {
    // Réduire les animations sur mobile pour de meilleures performances
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            * {
                -webkit-tap-highlight-color: transparent;
            }
            
            .platform-btn,
            .download-btn,
            .quality-option {
                transition: all 0.15s ease;
            }
            
            .history-item {
                transition: all 0.15s ease;
            }
        }
    `;
    document.head.appendChild(style);
}

function handleOrientationChange() {
    setTimeout(() => {
        isLandscape = window.innerWidth > window.innerHeight;
        adjustLayoutForOrientation();
    }, 100);
}

function handleResize() {
    const wasLandscape = isLandscape;
    isLandscape = window.innerWidth > window.innerHeight;
    
    if (wasLandscape !== isLandscape) {
        adjustLayoutForOrientation();
    }
}

function adjustLayoutForOrientation() {
    const header = document.querySelector('.header');
    const instructions = document.querySelector('.instructions');
    
    if (isLandscape && isMobile) {
        // Mode paysage sur mobile
        if (header) header.style.marginBottom = '10px';
        if (instructions) {
            instructions.style.fontSize = '0.8rem';
            instructions.style.padding = '8px';
        }
    } else {
        // Mode portrait
        if (header) header.style.marginBottom = '';
        if (instructions) {
            instructions.style.fontSize = '';
            instructions.style.padding = '';
        }
    }
}

function setupEventListeners() {
    // Sélection de plateforme
    platformButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectPlatform(button.dataset.platform);
        });
    });
    
    // Bouton de téléchargement
    downloadBtn.addEventListener('click', handleDownload);
    
    // Entrée dans le champ URL
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleDownload();
        }
    });
    
    // Fermeture des modales
    document.addEventListener('click', (e) => {
        if (e.target === loadingModal || e.target === errorModal) {
            closeModal(e.target);
        }
    });
}

function selectPlatform(platform) {
    selectedPlatform = platform;
    
    // Mettre à jour l'interface
    platformButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-platform="${platform}"]`).classList.add('active');
    
    // Mettre à jour le placeholder
    updatePlaceholder(platform);
}

function updatePlaceholder(platform) {
    const placeholders = {
        youtube: 'https://www.youtube.com/watch?v=...',
        instagram: 'https://www.instagram.com/p/...',
        tiktok: 'https://www.tiktok.com/@user/video/...',
        facebook: 'https://www.facebook.com/watch?v=...',
        twitter: 'https://twitter.com/user/status/...'
    };
    
    videoUrlInput.placeholder = placeholders[platform] || 'Collez l\'URL de la vidéo...';
}

function detectPlatform() {
    const url = videoUrlInput.value.toLowerCase();
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        selectPlatform('youtube');
    } else if (url.includes('instagram.com')) {
        selectPlatform('instagram');
    } else if (url.includes('tiktok.com')) {
        selectPlatform('tiktok');
    } else if (url.includes('facebook.com')) {
        selectPlatform('facebook');
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
        selectPlatform('twitter');
    }
}

function validateUrl(url, platform) {
    const patterns = {
        youtube: /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/,
        instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+/,
        tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/video\/[0-9]+/,
        facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/watch\?v=[0-9]+/,
        twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9._-]+\/status\/[0-9]+/
    };
    
    return patterns[platform] ? patterns[platform].test(url) : true;
}

async function handleDownload() {
    const url = videoUrlInput.value.trim();
    const quality = document.querySelector('input[name="quality"]:checked').value;
    
    // Validation
    if (!url) {
        showError('Veuillez entrer une URL de vidéo');
        return;
    }
    
    if (!validateUrl(url, selectedPlatform)) {
        showError(`URL invalide pour ${selectedPlatform}. Veuillez vérifier le format.`);
        return;
    }
    
    // Afficher le modal de chargement
    showLoadingModal();
    
    try {
        // Téléchargement direct sans API
        updateLoadingMessage('Préparation du téléchargement...');
        const result = await downloadDirect(url, selectedPlatform, quality);
        
        // Ajouter à l'historique
        addToHistory(url, selectedPlatform, quality, result);
        
        // Réinitialiser le formulaire
        videoUrlInput.value = '';
        
        // Fermer le modal de chargement
        closeLoadingModal();
        
        // Démarrer le téléchargement
        if (result.success) {
            startDirectDownload(result.downloadUrl, result.filename || 'video');
            showSuccess(`Téléchargement démarré pour ${result.title || 'la vidéo'} !`);
        } else {
            showError(result.error || 'Échec du téléchargement');
        }
        
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        closeLoadingModal();
        showError(`Erreur de téléchargement: ${error.message}`);
    }
}

// Fonction de téléchargement direct sans API
async function downloadDirect(url, platform, quality) {
    try {
        // Extraire les informations basiques de l'URL
        const videoInfo = extractBasicVideoInfo(url, platform);
        
        // Sélectionner le service de téléchargement approprié
        const downloadService = selectDownloadService(platform, quality);
        
        // Construire l'URL de téléchargement
        const downloadUrl = buildDownloadUrl(downloadService, url, quality);
        
        return {
            success: true,
            downloadUrl: downloadUrl,
            filename: `${videoInfo.title}.${getFileExtension(quality)}`,
            title: videoInfo.title,
            message: 'Téléchargement préparé'
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Extraire les informations basiques de l'URL
function extractBasicVideoInfo(url, platform) {
    const videoId = extractVideoId(url, platform);
    let title = `${platform}_${videoId}`;
    
    // Essayer d'extraire un titre plus propre
    try {
        if (platform === 'youtube') {
            title = `YouTube_${videoId}`;
        } else if (platform === 'tiktok') {
            title = `TikTok_${Date.now()}`;
        } else if (platform === 'instagram') {
            title = `Instagram_${Date.now()}`;
        } else if (platform === 'twitter') {
            title = `Twitter_${Date.now()}`;
        } else if (platform === 'facebook') {
            title = `Facebook_${Date.now()}`;
        }
    } catch (error) {
        title = `video_${Date.now()}`;
    }
    
    return {
        title: title,
        videoId: videoId,
        url: url
    };
}

// Sélectionner le service de téléchargement
function selectDownloadService(platform, quality) {
    const services = {
        youtube: [
            {
                name: 'SaveFrom',
                baseUrl: 'https://savefrom.net/',
                pattern: '#url={URL}'
            },
            {
                name: 'Y2Mate',
                baseUrl: 'https://www.y2mate.com/fr/',
                pattern: 'analyze?q={URL}'
            },
            {
                name: '9xBuddy',
                baseUrl: 'https://9xbuddy.org/process',
                pattern: '?url={URL}'
            }
        ],
        tiktok: [
            {
                name: 'SnapTik',
                baseUrl: 'https://snaptik.app/fr',
                pattern: '?url={URL}'
            },
            {
                name: 'TikMate',
                baseUrl: 'https://tikmate.online/',
                pattern: '?url={URL}'
            }
        ],
        instagram: [
            {
                name: 'SaveFrom',
                baseUrl: 'https://savefrom.net/',
                pattern: '#url={URL}'
            },
            {
                name: 'InstaDownloader',
                baseUrl: 'https://instadownloader.net/',
                pattern: '?url={URL}'
            }
        ],
        twitter: [
            {
                name: 'TwitterVideoDownloader',
                baseUrl: 'https://twittervideodownloader.com/',
                pattern: '?url={URL}'
            }
        ],
        facebook: [
            {
                name: 'SaveFrom',
                baseUrl: 'https://savefrom.net/',
                pattern: '#url={URL}'
            }
        ]
    };
    
    const platformServices = services[platform] || services.youtube;
    return platformServices[0]; // Utiliser le premier service disponible
}

// Construire l'URL de téléchargement
function buildDownloadUrl(service, videoUrl, quality) {
    const encodedUrl = encodeURIComponent(videoUrl);
    return service.baseUrl + service.pattern.replace('{URL}', encodedUrl);
}

// Démarrer le téléchargement direct
function startDirectDownload(downloadUrl, filename) {
    // Créer un iframe caché pour éviter de quitter la page
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    
    // Supprimer l'iframe après 10 secondes
    setTimeout(() => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 10000);
}

// Obtenir l'extension de fichier selon la qualité
function getFileExtension(quality) {
    switch (quality) {
        case 'audio':
            return 'mp3';
        case 'low':
        case 'medium':
        case 'high':
        case 'best':
            return 'mp4';
        default:
            return 'mp4';
    }
}

function addToHistory(url, platform, quality, backendResult = null) {
    const historyItem = {
        id: Date.now(),
        url: url,
        platform: platform,
        quality: quality,
        date: new Date().toISOString(),
        title: extractVideoTitle(url, platform),
        filename: backendResult?.filename || null,
        downloadUrl: backendResult?.downloadUrl || null,
        size: backendResult?.size || null
    };
    
    downloadHistory.unshift(historyItem);
    
    // Limiter l'historique à 50 éléments
    if (downloadHistory.length > 50) {
        downloadHistory = downloadHistory.slice(0, 50);
    }
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
    
    // Essayer de sauvegarder sur le backend aussi
    saveHistoryToBackend();
    
    // Mettre à jour l'affichage
    loadDownloadHistory();
}

async function saveHistoryToBackend() {
    // Sauvegarder dans le localStorage seulement
    try {
        localStorage.setItem('videoDownloadHistory', JSON.stringify(downloadHistory));
        return true;
    } catch (error) {
        console.warn('Impossible de sauvegarder l\'historique:', error);
        return false;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function extractVideoTitle(url, platform) {
    // Extraction basique du titre depuis l'URL
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    
    switch (platform) {
        case 'youtube':
            return `Vidéo YouTube - ${lastPart.split('?')[0]}`;
        case 'instagram':
            return `Post Instagram - ${lastPart}`;
        case 'tiktok':
            return `Vidéo TikTok - ${lastPart}`;
        case 'facebook':
            return `Vidéo Facebook - ${lastPart.split('?')[0]}`;
        case 'twitter':
            return `Tweet - ${lastPart}`;
        default:
            return `Vidéo - ${lastPart}`;
    }
}

function loadDownloadHistory() {
    historyList.innerHTML = '';
    
    if (downloadHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Aucun téléchargement récent</p>';
        return;
    }
    
    downloadHistory.forEach(item => {
        const historyItem = createHistoryItem(item);
        historyList.appendChild(historyItem);
    });
}

function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const platformIcons = {
        youtube: 'fab fa-youtube',
        instagram: 'fab fa-instagram',
        tiktok: 'fab fa-tiktok',
        facebook: 'fab fa-facebook',
        twitter: 'fab fa-twitter'
    };
    
    const date = new Date(item.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let downloadButton = '';
    if (item.downloadUrl && item.filename) {
        downloadButton = `
            <a href="${item.downloadUrl}" download="${item.filename}" 
               style="background: #4CAF50; color: white; border: none; padding: 5px 10px; 
                      border-radius: 5px; text-decoration: none; font-size: 0.8rem; margin-right: 5px;">
                <i class="fas fa-download"></i>
            </a>
        `;
    }
    
    const sizeInfo = item.size ? ` - ${formatFileSize(item.size)}` : '';
    
    div.innerHTML = `
        <i class="${platformIcons[item.platform] || 'fas fa-video'}"></i>
        <div class="history-info">
            <div class="history-title">${item.title}</div>
            <div class="history-url">${item.url}</div>
            <div class="history-date">${date} - Qualité: ${item.quality}${sizeInfo}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
            ${downloadButton}
            <button onclick="removeFromHistory(${item.id})" style="background: none; border: none; color: #ff6b6b; cursor: pointer; padding: 5px;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

function removeFromHistory(id) {
    downloadHistory = downloadHistory.filter(item => item.id !== id);
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
    loadDownloadHistory();
}

function showLoadingModal() {
    loadingModal.style.display = 'flex';
}

function closeLoadingModal() {
    loadingModal.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

function closeErrorModal() {
    errorModal.style.display = 'none';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function showSuccess(message) {
    // Créer une notification de succès temporaire
    const notification = document.createElement('div');
    notification.className = 'notification success-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Adaptation mobile
    if (isMobile) {
        notification.style.cssText += `
            left: 20px;
            right: 20px;
            max-width: none;
            top: 10px;
            padding: 12px 16px;
            font-size: 14px;
        `;
    }
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showSuccessWithDownload(message, downloadUrl, filename) {
    // Déclencher automatiquement le téléchargement
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Créer une notification de succès
    const notification = document.createElement('div');
    notification.className = 'notification download-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Adaptation mobile
    if (isMobile) {
        notification.style.cssText += `
            left: 20px;
            right: 20px;
            max-width: none;
            top: 10px;
            padding: 16px;
            font-size: 14px;
        `;
    }
    
    notification.innerHTML = `
        <div style="margin-bottom: 10px;">
            <i class="fas fa-check-circle"></i> ${message}
        </div>
        <div style="font-size: 0.9em; opacity: 0.9;">
            Le téléchargement a commencé automatiquement
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

async function tryAlternativeServices(url, platform, quality) {
    // Services de téléchargement alternatifs côté client
    const alternatives = getAlternativeServices(platform);
    
    // Retourner la liste des services alternatifs
    return alternatives.map(service => ({
        name: service.name,
        url: buildDownloadUrl(service, url, quality),
        description: `Télécharger via ${service.name}`
    }));
}

function getAlternativeServices(platform) {
    const allServices = {
        youtube: [
            {
                name: 'SaveFrom.net',
                baseUrl: 'https://savefrom.net/',
                pattern: '#url={URL}'
            },
            {
                name: 'Y2Mate',
                baseUrl: 'https://www.y2mate.com/fr/',
                pattern: 'analyze?q={URL}'
            },
            {
                name: '9xBuddy',
                baseUrl: 'https://9xbuddy.org/process',
                pattern: '?url={URL}'
            },
            {
                name: 'KeepVid',
                baseUrl: 'https://keepvid.com/',
                pattern: '?url={URL}'
            }
        ],
        tiktok: [
            {
                name: 'SnapTik',
                baseUrl: 'https://snaptik.app/fr',
                pattern: '?url={URL}'
            },
            {
                name: 'TikMate',
                baseUrl: 'https://tikmate.online/',
                pattern: '?url={URL}'
            },
            {
                name: 'TTDownloader',
                baseUrl: 'https://ttdownloader.com/',
                pattern: '?url={URL}'
            }
        ],
        instagram: [
            {
                name: 'SaveFrom.net',
                baseUrl: 'https://savefrom.net/',
                pattern: '#url={URL}'
            },
            {
                name: 'InstaDownloader',
                baseUrl: 'https://instadownloader.net/',
                pattern: '?url={URL}'
            },
            {
                name: 'DownloadGram',
                baseUrl: 'https://downloadgram.org/',
                pattern: '?url={URL}'
            }
        ],
        twitter: [
            {
                name: 'TwitterVideoDownloader',
                baseUrl: 'https://twittervideodownloader.com/',
                pattern: '?url={URL}'
            },
            {
                name: 'GetFVid',
                baseUrl: 'https://www.getfvid.com/',
                pattern: '?url={URL}'
            }
        ],
        facebook: [
            {
                name: 'SaveFrom.net',
                baseUrl: 'https://savefrom.net/',
                pattern: '#url={URL}'
            },
            {
                name: 'FBDownloader',
                baseUrl: 'https://fbdownloader.net/',
                pattern: '?url={URL}'
            }
        ]
    };
    
    return allServices[platform] || allServices.youtube;
}

function showErrorWithAlternatives(errorMessage, url, platform) {
    // Obtenir les services alternatifs
    const alternatives = getAlternativeServices(platform);
    
    // Créer le modal d'erreur avec alternatives
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        text-align: center;
    `;
    
    // Adaptation mobile
    if (isMobile) {
        content.style.cssText += `
            padding: 20px;
            margin: 20px;
            font-size: 14px;
        `;
    }
    
    content.innerHTML = `
        <div style="color: #f44336; margin-bottom: 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
            <h3 style="margin: 0 0 10px 0;">Erreur de téléchargement</h3>
            <p style="margin: 0; color: #666;">${errorMessage}</p>
        </div>
        
        <div style="margin-bottom: 25px;">
            <h4 style="color: #333; margin-bottom: 15px;">Essayez ces services alternatifs :</h4>
            <div class="alternatives-list">
                ${alternatives.map(service => `
                    <button class="alternative-btn" data-url="${buildDownloadUrl(service, url, 'best')}" 
                            style="display: block; width: 100%; padding: 12px; margin: 8px 0; 
                                   background: #2196F3; color: white; border: none; border-radius: 8px; 
                                   cursor: pointer; font-size: 14px; transition: background 0.3s;">
                        <i class="fas fa-external-link-alt"></i> ${service.name}
                    </button>
                `).join('')}
            </div>
        </div>
        
        <button class="close-btn" style="background: #ccc; color: #333; border: none; 
                                         padding: 10px 20px; border-radius: 5px; cursor: pointer;">
            Fermer
        </button>
    `;
    
    // Ajouter les événements
    content.querySelectorAll('.alternative-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            startDirectDownload(url, 'video');
            document.body.removeChild(modal);
        });
        
        // Effet hover
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#1976D2';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = '#2196F3';
        });
    });
    
    content.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function extractVideoId(url, platform) {
    try {
        const urlObj = new URL(url);
        
        switch (platform) {
            case 'youtube':
                return urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
            case 'instagram':
                return urlObj.pathname.split('/p/')[1] || 'unknown';
            case 'tiktok':
                return urlObj.pathname.split('/video/')[1] || 'unknown';
            case 'facebook':
                return urlObj.searchParams.get('v') || 'unknown';
            case 'twitter':
                return urlObj.pathname.split('/status/')[1] || 'unknown';
            default:
                return 'unknown';
        }
    } catch (error) {
        return 'unknown';
    }
}

// Fonction pour mettre à jour le message du modal de chargement
function updateLoadingMessage(message) {
    const loadingText = document.querySelector('#loadingModal .loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

// Fonction pour afficher les informations de la vidéo
function displayVideoInfo(videoInfo) {
    const existingInfo = document.querySelector('.video-info-display');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'video-info-display';
    infoDiv.style.cssText = `
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
        max-width: 100%;
    `;
    
    infoDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
            ${videoInfo.title || 'Titre non disponible'}
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 14px; color: #666;">
            <span><strong>Durée:</strong> ${formatDuration(videoInfo.duration)}</span>
            <span><strong>Auteur:</strong> ${videoInfo.uploader || 'Inconnu'}</span>
            ${videoInfo.view_count ? `<span><strong>Vues:</strong> ${formatNumber(videoInfo.view_count)}</span>` : ''}
        </div>
        ${videoInfo.thumbnail ? `<img src="${videoInfo.thumbnail}" alt="Miniature" style="width: 100%; max-width: 200px; border-radius: 5px; margin-top: 10px;">` : ''}
    `;
    
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.parentNode.insertBefore(infoDiv, downloadBtn);
}

// Fonction pour formater la durée
function formatDuration(seconds) {
    if (!seconds || seconds === 0) return 'Inconnue';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else {
        return `${minutes}m ${remainingSeconds}s`;
    }
}

// Fonction pour formater les nombres
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else {
        return num.toString();
    }
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Fonction pour effacer tout l'historique
function clearAllHistory() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
        downloadHistory = [];
        localStorage.removeItem('downloadHistory');
        loadDownloadHistory();
    }
}

// Ajouter un bouton pour effacer l'historique
const clearHistoryBtn = document.createElement('button');
clearHistoryBtn.textContent = 'Effacer l\'historique';
clearHistoryBtn.style.cssText = `
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 15px;
    width: 100%;
`;
clearHistoryBtn.onclick = clearAllHistory;

// Ajouter le bouton à l'historique
document.querySelector('.download-history').appendChild(clearHistoryBtn); 