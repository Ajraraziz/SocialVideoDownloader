/**
 * SaveFrom.net Clone - JavaScript Frontend
 * Gestion complète de l'interface utilisateur et des interactions avec l'API
 */

class SaveFromApp {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentVideoInfo = null;
        this.currentDownloadId = null;
        this.pollInterval = null;
        this.selectedPlatform = 'auto';
        this.selectedFormat = 'video';
        
        this.initializeApp();
    }

    /**
     * Initialise l'application
     */
    initializeApp() {
        this.setupEventListeners();
        this.loadSupportedSites();
        this.setupNavigationSmoothScroll();
        this.setupPlatformSelector();
        this.setupFormatTabs();
        
        // Vérifier si il y a une URL dans les paramètres
        this.checkUrlParameter();
        
        console.log('SaveFrom Clone initialized');
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Bouton d'analyse
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeVideo());
        }

        // Entrée URL - Enter key
        const videoUrlInput = document.getElementById('videoUrl');
        if (videoUrlInput) {
            videoUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.analyzeVideo();
                }
            });
            
            // Auto-détection de la plateforme
            videoUrlInput.addEventListener('input', () => {
                this.autoDetectPlatform();
            });
        }

        // Bouton d'annulation
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelDownload());
        }

        // Fermeture des modales en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Gestion des touches ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Configuration du sélecteur de plateforme
     */
    setupPlatformSelector() {
        const platformBtns = document.querySelectorAll('.platform-btn');
        platformBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Retirer la classe active des autres boutons
                platformBtns.forEach(b => b.classList.remove('active'));
                
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active');
                
                // Mettre à jour la plateforme sélectionnée
                this.selectedPlatform = btn.dataset.platform;
                
                // Mettre à jour le placeholder
                this.updateUrlPlaceholder();
            });
        });
    }

    /**
     * Configuration des onglets de format
     */
    setupFormatTabs() {
        const formatTabs = document.querySelectorAll('.format-tab');
        formatTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Retirer la classe active des autres onglets
                formatTabs.forEach(t => t.classList.remove('active'));
                
                // Ajouter la classe active à l'onglet cliqué
                tab.classList.add('active');
                
                // Mettre à jour le format sélectionné
                this.selectedFormat = tab.dataset.type;
                
                // Rafraîchir la liste des formats
                this.displayFormats();
            });
        });
    }

    /**
     * Navigation fluide
     */
    setupNavigationSmoothScroll() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Mettre à jour les liens actifs
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
    }

    /**
     * Vérification des paramètres URL
     */
    checkUrlParameter() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoUrl = urlParams.get('url');
        
        if (videoUrl) {
            const videoUrlInput = document.getElementById('videoUrl');
            if (videoUrlInput) {
                videoUrlInput.value = decodeURIComponent(videoUrl);
                this.autoDetectPlatform();
                
                // Analyser automatiquement après un court délai
                setTimeout(() => {
                    this.analyzeVideo();
                }, 500);
            }
        }
    }

    /**
     * Détection automatique de la plateforme
     */
    autoDetectPlatform() {
        const url = document.getElementById('videoUrl').value.toLowerCase();
        
        if (!url || this.selectedPlatform !== 'auto') return;
        
        let detectedPlatform = 'auto';
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            detectedPlatform = 'youtube';
        } else if (url.includes('instagram.com')) {
            detectedPlatform = 'instagram';
        } else if (url.includes('tiktok.com')) {
            detectedPlatform = 'tiktok';
        } else if (url.includes('facebook.com')) {
            detectedPlatform = 'facebook';
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            detectedPlatform = 'twitter';
        }
        
        // Mettre à jour visuellement si une plateforme est détectée
        if (detectedPlatform !== 'auto') {
            const platformBtns = document.querySelectorAll('.platform-btn');
            platformBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.platform === detectedPlatform) {
                    btn.classList.add('active');
                }
            });
        }
        
        this.updateUrlPlaceholder();
    }

    /**
     * Met à jour le placeholder de l'URL
     */
    updateUrlPlaceholder() {
        const videoUrlInput = document.getElementById('videoUrl');
        if (!videoUrlInput) return;
        
        const placeholders = {
            auto: 'Collez l\'URL de la vidéo ici...',
            youtube: 'https://youtube.com/watch?v=... ou https://youtu.be/...',
            instagram: 'https://instagram.com/p/... ou /reel/...',
            tiktok: 'https://tiktok.com/@user/video/...',
            facebook: 'https://facebook.com/watch?v=...',
            twitter: 'https://twitter.com/user/status/... ou x.com/...'
        };
        
        const activePlatform = document.querySelector('.platform-btn.active')?.dataset.platform || 'auto';
        videoUrlInput.placeholder = placeholders[activePlatform];
    }

    /**
     * Analyse une vidéo
     */
    async analyzeVideo() {
        const videoUrl = document.getElementById('videoUrl').value.trim();
        
        if (!videoUrl) {
            this.showError('Veuillez entrer une URL de vidéo');
            return;
        }

        if (!this.isValidUrl(videoUrl)) {
            this.showError('Veuillez entrer une URL valide');
            return;
        }

        this.showLoading();
        this.setAnalyzeButtonState(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/info?url=${encodeURIComponent(videoUrl)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Erreur lors de l\'analyse');
            }

            this.currentVideoInfo = data;
            this.displayVideoInfo(data);
            this.hideLoading();
            
            // Faire défiler vers les résultats
            document.getElementById('results').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

        } catch (error) {
            console.error('Erreur:', error);
            this.showError(error.message || 'Erreur lors de l\'analyse de la vidéo');
        } finally {
            this.hideLoading();
            this.setAnalyzeButtonState(false);
        }
    }

    /**
     * Affiche les informations vidéo
     */
    displayVideoInfo(videoInfo) {
        // Afficher la section des résultats
        const resultsSection = document.getElementById('results');
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in');

        // Thumbnail
        const thumbnail = document.getElementById('videoThumbnail');
        if (thumbnail && videoInfo.thumbnail) {
            thumbnail.src = videoInfo.thumbnail;
            thumbnail.alt = videoInfo.title;
        }

        // Titre
        const title = document.getElementById('videoTitle');
        if (title) {
            title.textContent = videoInfo.title;
        }

        // Uploader
        const uploader = document.getElementById('videoUploader');
        if (uploader && videoInfo.uploader) {
            uploader.textContent = `Par ${videoInfo.uploader}`;
        }

        // Durée
        const duration = document.getElementById('videoDuration');
        if (duration && videoInfo.duration) {
            duration.textContent = this.formatDuration(videoInfo.duration);
        }

        // Statistiques
        const views = document.getElementById('videoViews');
        if (views && videoInfo.view_count) {
            views.innerHTML = `<i class="fas fa-eye"></i> ${this.formatNumber(videoInfo.view_count)} vues`;
        }

        const date = document.getElementById('videoDate');
        if (date && videoInfo.upload_date) {
            date.innerHTML = `<i class="fas fa-calendar"></i> ${this.formatDate(videoInfo.upload_date)}`;
        }

        // Afficher les formats
        this.displayFormats();
    }

    /**
     * Affiche les formats de téléchargement
     */
    displayFormats() {
        if (!this.currentVideoInfo) return;

        const formatList = document.getElementById('formatList');
        if (!formatList) return;

        formatList.innerHTML = '';

        const formats = this.currentVideoInfo.formats || [];
        const filteredFormats = this.filterFormats(formats);

        if (filteredFormats.length === 0) {
            formatList.innerHTML = '<p>Aucun format disponible pour ce type de contenu.</p>';
            return;
        }

        filteredFormats.forEach(format => {
            const formatItem = this.createFormatItem(format);
            formatList.appendChild(formatItem);
        });
    }

    /**
     * Filtre les formats selon le type sélectionné
     */
    filterFormats(formats) {
        if (this.selectedFormat === 'audio') {
            return formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));
        } else {
            return formats.filter(f => f.vcodec && f.vcodec !== 'none');
        }
    }

    /**
     * Crée un élément de format
     */
    createFormatItem(format) {
        const formatItem = document.createElement('div');
        formatItem.className = 'format-item';

        const quality = this.getQualityLabel(format);
        const fileSize = format.filesize ? this.formatFileSize(format.filesize) : 'Taille inconnue';
        const icon = this.selectedFormat === 'audio' ? 'fas fa-music' : 'fas fa-video';

        formatItem.innerHTML = `
            <div class="format-info">
                <div class="format-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="format-details">
                    <h5>${quality}</h5>
                    <p>${format.ext?.toUpperCase()} • ${format.format_note || 'Format standard'}</p>
                </div>
            </div>
            <div class="format-download">
                <span class="format-size">${fileSize}</span>
                <button class="download-format-btn" data-format="${format.format_id}">
                    <i class="fas fa-download"></i>
                    Télécharger
                </button>
            </div>
        `;

        // Ajouter l'événement de téléchargement
        const downloadBtn = formatItem.querySelector('.download-format-btn');
        downloadBtn.addEventListener('click', () => {
            this.downloadFormat(format.format_id);
        });

        return formatItem;
    }

    /**
     * Télécharge un format spécifique
     */
    async downloadFormat(formatId) {
        if (!this.currentVideoInfo) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: this.currentVideoInfo.webpage_url,
                    format_id: formatId,
                    quality: this.selectedFormat
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Erreur lors du téléchargement');
            }

            this.currentDownloadId = data.download_id;
            this.showProgressSection();
            this.startProgressPolling();

        } catch (error) {
            console.error('Erreur:', error);
            this.showError(error.message || 'Erreur lors du téléchargement');
        }
    }

    /**
     * Affiche la section de progression
     */
    showProgressSection() {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.style.display = 'block';
            progressSection.classList.add('fade-in');
            
            // Masquer les résultats
            document.getElementById('results').style.display = 'none';
            
            // Faire défiler vers la progression
            progressSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Démarre le polling de la progression
     */
    startProgressPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        this.pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/download/${this.currentDownloadId}/status`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || 'Erreur lors de la vérification du statut');
                }

                this.updateProgress(data);

                if (data.status === 'completed') {
                    this.onDownloadComplete(data);
                } else if (data.status === 'error') {
                    this.onDownloadError(data);
                }

            } catch (error) {
                console.error('Erreur de polling:', error);
                this.onDownloadError({ message: error.message });
            }
        }, 1000);
    }

    /**
     * Met à jour la progression
     */
    updateProgress(data) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressTitle = document.getElementById('progressTitle');

        if (progressFill) {
            progressFill.style.width = `${data.progress || 0}%`;
        }

        if (progressText) {
            progressText.textContent = `${data.progress || 0}%`;
        }

        if (progressTitle) {
            progressTitle.textContent = data.message || 'Téléchargement en cours...';
        }
    }

    /**
     * Téléchargement terminé
     */
    onDownloadComplete(data) {
        this.stopProgressPolling();
        
        // Télécharger le fichier
        const downloadUrl = `${this.apiBaseUrl}/api/download/${this.currentDownloadId}/file`;
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = '';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Afficher le succès
        this.showSuccess('Téléchargement terminé ! Le fichier a été téléchargé.');
        
        // Masquer la section de progression
        document.getElementById('progressSection').style.display = 'none';
        
        // Réafficher les résultats
        document.getElementById('results').style.display = 'block';
    }

    /**
     * Erreur de téléchargement
     */
    onDownloadError(data) {
        this.stopProgressPolling();
        this.showError(data.message || 'Erreur lors du téléchargement');
        
        // Masquer la section de progression
        document.getElementById('progressSection').style.display = 'none';
        
        // Réafficher les résultats
        document.getElementById('results').style.display = 'block';
    }

    /**
     * Annule le téléchargement
     */
    async cancelDownload() {
        if (!this.currentDownloadId) return;

        try {
            await fetch(`${this.apiBaseUrl}/api/download/${this.currentDownloadId}`, {
                method: 'DELETE'
            });

            this.stopProgressPolling();
            this.showSuccess('Téléchargement annulé');
            
            // Masquer la section de progression
            document.getElementById('progressSection').style.display = 'none';
            
            // Réafficher les résultats
            document.getElementById('results').style.display = 'block';

        } catch (error) {
            console.error('Erreur lors de l\'annulation:', error);
            this.showError('Erreur lors de l\'annulation du téléchargement');
        }
    }

    /**
     * Arrête le polling de progression
     */
    stopProgressPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Charge les sites supportés
     */
    async loadSupportedSites() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/supported-sites`);
            const data = await response.json();

            if (response.ok) {
                this.displaySupportedSites(data.supported_sites);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des sites:', error);
        }
    }

    /**
     * Affiche les sites supportés
     */
    displaySupportedSites(sites) {
        const sitesGrid = document.getElementById('sitesGrid');
        if (!sitesGrid) return;

        sitesGrid.innerHTML = '';

        sites.forEach(site => {
            const siteCard = document.createElement('div');
            siteCard.className = 'site-card';
            siteCard.innerHTML = `
                <div class="site-icon">
                    <i class="${site.icon}"></i>
                </div>
                <h3>${site.name}</h3>
                <p>${site.domain}</p>
            `;
            sitesGrid.appendChild(siteCard);
        });
    }

    /**
     * Utilitaires
     */
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getQualityLabel(format) {
        if (format.height) {
            return `${format.height}p`;
        } else if (format.format_note) {
            return format.format_note;
        } else if (format.abr) {
            return `${format.abr}kbps`;
        }
        return 'Qualité inconnue';
    }

    /**
     * Gestion des UI states
     */
    
    setAnalyzeButtonState(loading) {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (!analyzeBtn) return;

        if (loading) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyse...';
        } else {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyser';
        }
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    showError(message) {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorModal && errorMessage) {
            errorMessage.textContent = message;
            errorModal.classList.add('active');
        }
    }

    showSuccess(message) {
        const successModal = document.getElementById('successModal');
        const successMessage = document.getElementById('successMessage');
        
        if (successModal && successMessage) {
            successMessage.textContent = message;
            successModal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }
}

// Fonctions globales pour les modales
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    window.saveFromApp = new SaveFromApp();
});

// Gestion des erreurs non capturées
window.addEventListener('error', (event) => {
    console.error('Erreur non capturée:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesse rejetée:', event.reason);
});

// Service Worker (optionnel)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
}