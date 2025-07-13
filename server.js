const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
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
        
        // Extraction réelle des informations avec yt-dlp
        const videoInfo = await extractVideoInfo(url, platform);
        
        res.json({
            success: true,
            data: videoInfo
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'extraction des informations:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'extraction des informations de la vidéo',
            details: error.message
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
        
        // Téléchargement réel avec yt-dlp
        const downloadResult = await downloadVideo(url, platform, quality);
        
        res.json({
            success: true,
            data: downloadResult
        });
        
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        res.status(500).json({
            error: 'Erreur lors du téléchargement de la vidéo',
            details: error.message
        });
    }
});

// API pour obtenir la liste des formats disponibles
app.post('/api/formats', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL requise' });
        }
        
        const formats = await getVideoFormats(url);
        
        res.json({
            success: true,
            data: formats
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'obtention des formats:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'obtention des formats',
            details: error.message
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

// API pour servir les fichiers téléchargés
app.get('/downloads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(downloadsDir, filename);
    
    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ error: 'Fichier non trouvé' });
    }
});

// Fonction pour extraire les informations de la vidéo avec yt-dlp
async function extractVideoInfo(url, platform) {
    try {
        const command = `yt-dlp --dump-json --no-download "${url}"`;
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr && stderr.includes('ERROR')) {
            throw new Error(stderr);
        }
        
        const videoData = JSON.parse(stdout);
        
        return {
            title: videoData.title || 'Titre non disponible',
            duration: videoData.duration || 0,
            thumbnail: videoData.thumbnail || '',
            uploader: videoData.uploader || 'Inconnu',
            view_count: videoData.view_count || 0,
            description: videoData.description || '',
            upload_date: videoData.upload_date || '',
            filesize: videoData.filesize_approx || 0,
            formats: videoData.formats ? videoData.formats.length : 0
        };
        
    } catch (error) {
        console.error('Erreur yt-dlp:', error);
        throw new Error(`Impossible d'extraire les informations: ${error.message}`);
    }
}

// Fonction pour obtenir les formats disponibles
async function getVideoFormats(url) {
    try {
        const command = `yt-dlp --list-formats --dump-json "${url}"`;
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr && stderr.includes('ERROR')) {
            throw new Error(stderr);
        }
        
        const lines = stdout.split('\n').filter(line => line.trim());
        const formats = [];
        
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if (data.format_id) {
                    formats.push({
                        format_id: data.format_id,
                        ext: data.ext,
                        quality: data.quality || data.height || 'unknown',
                        filesize: data.filesize || data.filesize_approx || 0,
                        vcodec: data.vcodec || 'unknown',
                        acodec: data.acodec || 'unknown',
                        resolution: data.resolution || `${data.width}x${data.height}` || 'unknown'
                    });
                }
            } catch (e) {
                // Ignorer les lignes qui ne sont pas du JSON
            }
        }
        
        return formats;
        
    } catch (error) {
        console.error('Erreur lors de l\'obtention des formats:', error);
        throw new Error(`Impossible d'obtenir les formats: ${error.message}`);
    }
}

// Fonction pour télécharger la vidéo avec yt-dlp
async function downloadVideo(url, platform, quality = 'best') {
    try {
        const timestamp = Date.now();
        const outputTemplate = path.join(downloadsDir, `%(title)s_${timestamp}.%(ext)s`);
        
        // Déterminer le format à télécharger
        let formatSelector = 'best';
        if (quality === 'audio') {
            formatSelector = 'bestaudio/best';
        } else if (quality === 'low') {
            formatSelector = 'worst';
        } else if (quality === 'medium') {
            formatSelector = 'best[height<=720]';
        } else if (quality === 'high') {
            formatSelector = 'best[height<=1080]';
        }
        
        const command = `yt-dlp -f "${formatSelector}" -o "${outputTemplate}" "${url}"`;
        console.log('Commande yt-dlp:', command);
        
        const { stdout, stderr } = await execAsync(command, { timeout: 300000 }); // 5 minutes timeout
        
        if (stderr && stderr.includes('ERROR')) {
            throw new Error(stderr);
        }
        
        // Trouver le fichier téléchargé
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find(file => file.includes(timestamp.toString()));
        
        if (!downloadedFile) {
            throw new Error('Fichier téléchargé non trouvé');
        }
        
        const filepath = path.join(downloadsDir, downloadedFile);
        const stats = fs.statSync(filepath);
        
        return {
            filename: downloadedFile,
            size: stats.size,
            downloadUrl: `/downloads/${downloadedFile}`,
            message: 'Téléchargement terminé avec succès'
        };
        
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        throw new Error(`Échec du téléchargement: ${error.message}`);
    }
}

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