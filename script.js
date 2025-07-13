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
        // Étape 1: Obtenir les informations de la vidéo
        updateLoadingMessage('Récupération des informations de la vidéo...');
        const videoInfo = await getVideoInfo(url, selectedPlatform);
        
        // Afficher les informations de la vidéo
        displayVideoInfo(videoInfo);
        
        // Étape 2: Télécharger la vidéo
        updateLoadingMessage('Téléchargement en cours...');
        const backendResult = await downloadWithBackend(url, selectedPlatform, quality);
        
        // Ajouter à l'historique avec les informations complètes
        addToHistory(url, selectedPlatform, quality, backendResult);
        
        // Réinitialiser le formulaire
        videoUrlInput.value = '';
        
        // Fermer le modal de chargement
        closeLoadingModal();
        
        // Afficher un message de succès avec lien de téléchargement
        if (backendResult && backendResult.downloadUrl) {
            showSuccessWithDownload(
                `${backendResult.title} est prêt à télécharger !`, 
                backendResult.downloadUrl, 
                backendResult.filename
            );
        } else {
            showSuccess('Vidéo téléchargée avec succès !');
        }
        
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        closeLoadingModal();
        
        // Afficher une erreur spécifique selon le type d'erreur
        if (error.message.includes('Sign in to confirm')) {
            showError('Cette vidéo nécessite une authentification. Essayez avec une vidéo publique.');
        } else if (error.message.includes('404')) {
            showError('Vidéo non trouvée. Vérifiez que l\'URL est correcte et que la vidéo existe.');
        } else if (error.message.includes('private')) {
            showError('Cette vidéo est privée et ne peut pas être téléchargée.');
        } else {
            showError(`Erreur de téléchargement: ${error.message}`);
        }
    }
}

async function simulateDownload(url, platform, quality) {
    // Simulation d'un téléchargement
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simuler une erreur aléatoire (10% de chance)
            if (Math.random() < 0.1) {
                reject(new Error('Erreur de téléchargement. Veuillez réessayer.'));
                return;
            }
            
            // Simuler un succès
            resolve({
                url: url,
                platform: platform,
                quality: quality,
                filename: `video_${Date.now()}.mp4`
            });
        }, 2000 + Math.random() * 3000); // 2-5 secondes
    });
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
    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history: downloadHistory })
        });
    } catch (error) {
        console.log('Impossible de sauvegarder l\'historique sur le backend');
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

async function downloadWithBackend(url, platform, quality) {
    try {
        // Étape 1: Obtenir les informations de la vidéo
        const infoResponse = await fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                platform: platform
            })
        });
        
        if (!infoResponse.ok) {
            const errorData = await infoResponse.json();
            throw new Error(errorData.error || 'Impossible d\'obtenir les informations de la vidéo');
        }
        
        const infoData = await infoResponse.json();
        const videoInfo = infoData.data;
        
        // Étape 2: Déclencher le téléchargement
        const downloadResponse = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                platform: platform,
                quality: quality
            })
        });
        
        if (!downloadResponse.ok) {
            const errorData = await downloadResponse.json();
            throw new Error(errorData.error || 'Échec du téléchargement');
        }
        
        const downloadData = await downloadResponse.json();
        const downloadResult = downloadData.data;
        
        return {
            downloadUrl: downloadResult.downloadUrl,
            filename: downloadResult.filename,
            size: downloadResult.size,
            title: videoInfo.title,
            success: true,
            message: downloadResult.message
        };
        
    } catch (error) {
        console.error('Erreur téléchargement yt-dlp:', error);
        throw new Error(`Impossible de télécharger la vidéo: ${error.message}`);
    }
}

// Nouvelle fonction pour obtenir les informations vidéo
async function getVideoInfo(url, platform) {
    try {
        const response = await fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                platform: platform
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Impossible d\'obtenir les informations');
        }
        
        const data = await response.json();
        return data.data;
        
    } catch (error) {
        console.error('Erreur lors de l\'obtention des informations:', error);
        throw error;
    }
}

// Nouvelle fonction pour obtenir les formats disponibles
async function getVideoFormats(url) {
    try {
        const response = await fetch('/api/formats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Impossible d\'obtenir les formats');
        }
        
        const data = await response.json();
        return data.data;
        
    } catch (error) {
        console.error('Erreur lors de l\'obtention des formats:', error);
        throw error;
    }
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
    // Créer une notification de succès avec lien de téléchargement
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
    
    const downloadButtonStyle = isMobile ? 
        `display: block; background: white; color: #4CAF50; 
         padding: 10px 15px; border-radius: 6px; text-decoration: none; 
         font-weight: 600; margin-top: 12px; text-align: center; font-size: 14px;` :
        `display: inline-block; background: white; color: #4CAF50; 
         padding: 8px 15px; border-radius: 5px; text-decoration: none; 
         font-weight: 600; margin-top: 10px;`;
    
    notification.innerHTML = `
        <div style="margin-bottom: 10px;">${message}</div>
        <a href="${downloadUrl}" download="${filename}" 
           style="${downloadButtonStyle}">
            <i class="fas fa-download"></i> Télécharger le fichier
        </a>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 10 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 10000);
}

async function tryAlternativeServices(url, platform, quality) {
    // Essayer différents services de téléchargement
    const services = [
        {
            name: 'SaveFrom.net',
            url: `https://en.savefrom.net/${encodeURIComponent(url)}`
        },
        {
            name: 'Y2Mate',
            url: `https://www.y2mate.com/youtube/${extractVideoId(url, platform)}`
        },
        {
            name: 'Online Video Converter',
            url: `https://onlinevideoconverter.com/fr/youtube-converter?url=${encodeURIComponent(url)}`
        }
    ];
    
    // Ouvrir le premier service dans un nouvel onglet
    const service = services[0];
    window.open(service.url, '_blank');
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                service: service.name,
                url: service.url
            });
        }, 1000);
    });
}

function showErrorWithAlternatives(errorMessage, url, platform) {
    // Créer une notification d'erreur avec alternatives
    const notification = document.createElement('div');
    notification.className = 'notification error-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideIn 0.3s ease;
        max-width: 350px;
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
    
    const alternatives = [
        { name: 'SaveFrom.net', url: `https://en.savefrom.net/${encodeURIComponent(url)}` },
        { name: 'Y2Mate', url: `https://www.y2mate.com/youtube/${extractVideoId(url, platform)}` },
        { name: 'Online Video Converter', url: `https://onlinevideoconverter.com/fr/youtube-converter?url=${encodeURIComponent(url)}` }
    ];
    
    let alternativesHtml = '';
    alternatives.forEach(alt => {
        const buttonStyle = isMobile ?
            `display: block; background: rgba(255,255,255,0.2); color: white; 
             padding: 10px 12px; border-radius: 6px; text-decoration: none; 
             margin-top: 8px; text-align: center; font-size: 13px;` :
            `display: block; background: rgba(255,255,255,0.2); color: white; 
             padding: 8px 12px; border-radius: 5px; text-decoration: none; 
             margin-top: 8px; text-align: center;`;
        
        alternativesHtml += `
            <a href="${alt.url}" target="_blank" 
               style="${buttonStyle}">
                <i class="fas fa-external-link-alt"></i> ${alt.name}
            </a>
        `;
    });
    
    const closeButtonStyle = isMobile ?
        `background: rgba(255,255,255,0.2); color: white; border: none; 
         padding: 8px 12px; border-radius: 6px; cursor: pointer; 
         margin-top: 12px; width: 100%; font-size: 14px;` :
        `background: rgba(255,255,255,0.2); color: white; border: none; 
         padding: 5px 10px; border-radius: 3px; cursor: pointer; 
         margin-top: 10px; width: 100%;`;
    
    notification.innerHTML = `
        <div style="margin-bottom: 10px;">
            <i class="fas fa-exclamation-triangle"></i> ${errorMessage}
        </div>
        <div style="font-size: ${isMobile ? '0.85rem' : '0.9rem'}; margin-bottom: 10px;">
            Essayez ces services alternatifs :
        </div>
        ${alternativesHtml}
        <button onclick="this.parentElement.remove()" 
                style="${closeButtonStyle}">
            Fermer
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