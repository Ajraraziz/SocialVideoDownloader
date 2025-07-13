const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Créer le dossier downloads s'il n'existe pas
const downloadsDir = path.join(__dirname, 'downloads');
fs.ensureDirSync(downloadsDir);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API pour obtenir les informations de la vidéo
app.post('/api/video-info', async (req, res) => {
    try {
        const { url, platform } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL requise' });
        }
        
        // Simulation d'extraction d'informations
        const videoInfo = await extractVideoInfo(url, platform);
        
        res.json({
            success: true,
            data: videoInfo
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'extraction des informations:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'extraction des informations de la vidéo'
        });
    }
});

// API pour télécharger la vidéo
app.post('/api/download', async (req, res) => {
    try {
        const { url, platform, quality } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL requise' });
        }
        
        // Simulation de téléchargement
        const downloadResult = await simulateDownload(url, platform, quality);
        
        res.json({
            success: true,
            data: downloadResult
        });
        
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        res.status(500).json({
            error: 'Erreur lors du téléchargement de la vidéo'
        });
    }
});

// API pour obtenir l'historique
app.get('/api/history', (req, res) => {
    try {
        const historyFile = path.join(__dirname, 'history.json');
        
        if (fs.existsSync(historyFile)) {
            const history = fs.readJsonSync(historyFile);
            res.json({ success: true, data: history });
        } else {
            res.json({ success: true, data: [] });
        }
        
    } catch (error) {
        console.error('Erreur lors de la lecture de l\'historique:', error);
        res.status(500).json({ error: 'Erreur lors de la lecture de l\'historique' });
    }
});

// API pour sauvegarder l'historique
app.post('/api/history', (req, res) => {
    try {
        const { history } = req.body;
        const historyFile = path.join(__dirname, 'history.json');
        
        fs.writeJsonSync(historyFile, history);
        
        res.json({ success: true, message: 'Historique sauvegardé' });
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'historique:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde de l\'historique' });
    }
});

// Fonction pour extraire les informations de la vidéo
async function extractVideoInfo(url, platform) {
    // Simulation d'extraction d'informations
    return new Promise((resolve) => {
        setTimeout(() => {
            const videoId = extractVideoId(url, platform);
            
            resolve({
                id: videoId,
                title: `Vidéo ${platform} - ${videoId}`,
                duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
                thumbnail: `https://via.placeholder.com/320x180/667eea/ffffff?text=${platform}`,
                qualities: ['best', '720p', '480p', '360p', 'audio'],
                platform: platform,
                url: url
            });
        }, 1000);
    });
}

// Fonction pour simuler le téléchargement
async function simulateDownload(url, platform, quality) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simuler une erreur aléatoire (5% de chance)
            if (Math.random() < 0.05) {
                reject(new Error('Erreur de téléchargement. Veuillez réessayer.'));
                return;
            }
            
            const videoId = extractVideoId(url, platform);
            const filename = `${platform}_${videoId}_${quality}_${Date.now()}.mp4`;
            const filePath = path.join(downloadsDir, filename);
            
            // Créer un fichier factice
            fs.writeFileSync(filePath, `Simulated video file for ${url}`);
            
            resolve({
                filename: filename,
                filePath: filePath,
                size: Math.floor(Math.random() * 100000000) + 1000000, // 1-100 MB
                quality: quality,
                platform: platform,
                url: url,
                downloadUrl: `/downloads/${filename}`
            });
        }, 2000 + Math.random() * 3000); // 2-5 secondes
    });
}

// Fonction pour extraire l'ID de la vidéo
function extractVideoId(url, platform) {
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
}

// Route pour servir les fichiers téléchargés
app.use('/downloads', express.static(downloadsDir));

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📁 Dossier de téléchargements: ${downloadsDir}`);
    console.log(`🌐 Ouvrez votre navigateur et allez sur http://localhost:${PORT}`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur...');
    process.exit(0);
}); 