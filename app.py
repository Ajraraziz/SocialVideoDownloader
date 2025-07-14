#!/usr/bin/env python3
"""
SaveFrom.net Clone - Backend API
Un serveur API complet pour télécharger des vidéos depuis de multiples plateformes
"""

import asyncio
import json
import os
import tempfile
import time
from typing import Dict, List, Optional, Union
from urllib.parse import urlparse
import uuid
import logging
from datetime import datetime, timedelta

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl

import yt_dlp
from yt_dlp.utils import DownloadError

# Configuration
TEMP_DIR = tempfile.gettempdir()
DOWNLOAD_DIR = os.path.join(TEMP_DIR, "downloads")
CACHE_DIR = os.path.join(TEMP_DIR, "cache")
CACHE_DURATION = 3600  # 1 heure en secondes

# Créer les dossiers nécessaires
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache en mémoire pour les métadonnées
metadata_cache: Dict[str, Dict] = {}
download_cache: Dict[str, Dict] = {}

# Modèles Pydantic
class VideoInfo(BaseModel):
    id: str
    title: str
    thumbnail: str
    duration: Optional[int] = None
    uploader: Optional[str] = None
    view_count: Optional[int] = None
    upload_date: Optional[str] = None
    formats: List[Dict] = []
    platform: str
    webpage_url: str

class DownloadRequest(BaseModel):
    url: HttpUrl
    format_id: Optional[str] = "best"
    quality: Optional[str] = "best"

class DownloadResponse(BaseModel):
    download_id: str
    status: str
    message: str
    progress: Optional[float] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None

# Initialisation FastAPI
app = FastAPI(
    title="SaveFrom.net Clone API",
    description="API pour télécharger des vidéos depuis de multiples plateformes",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monter les fichiers statiques
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configuration yt-dlp
def get_ytdl_options(download_path: str = None) -> Dict:
    """Configuration yt-dlp optimisée"""
    options = {
        'format': 'best[height<=1080]',
        'outtmpl': os.path.join(download_path or DOWNLOAD_DIR, '%(title)s.%(ext)s'),
        'writesubtitles': False,
        'writeautomaticsub': False,
        'ignoreerrors': False,
        'no_warnings': False,
        'extractflat': False,
        'writethumbnail': False,
        'writeinfojson': False,
        # Optimisations réseau
        'socket_timeout': 30,
        'retries': 3,
        'fragment_retries': 3,
        # Headers pour éviter les blocages
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }
    return options

def clean_old_files():
    """Nettoie les anciens fichiers téléchargés"""
    try:
        current_time = time.time()
        for filename in os.listdir(DOWNLOAD_DIR):
            file_path = os.path.join(DOWNLOAD_DIR, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getctime(file_path)
                if file_age > 7200:  # 2 heures
                    os.remove(file_path)
                    logger.info(f"Ancien fichier supprimé: {filename}")
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage: {e}")

def get_cache_key(url: str) -> str:
    """Génère une clé de cache pour l'URL"""
    return f"cache_{hash(url)}"

def is_cache_valid(cache_entry: Dict) -> bool:
    """Vérifie si l'entrée de cache est encore valide"""
    if not cache_entry:
        return False
    
    cache_time = cache_entry.get('cached_at', 0)
    return (time.time() - cache_time) < CACHE_DURATION

def detect_platform(url: str) -> str:
    """Détecte la plateforme depuis l'URL"""
    domain = urlparse(url).netloc.lower()
    
    platform_map = {
        'youtube.com': 'youtube',
        'youtu.be': 'youtube',
        'instagram.com': 'instagram',
        'tiktok.com': 'tiktok',
        'facebook.com': 'facebook',
        'twitter.com': 'twitter',
        'x.com': 'twitter',
        'vimeo.com': 'vimeo',
        'dailymotion.com': 'dailymotion',
        'twitch.tv': 'twitch'
    }
    
    for domain_key, platform in platform_map.items():
        if domain_key in domain:
            return platform
    
    return 'unknown'

def format_video_info(info: Dict) -> VideoInfo:
    """Formate les informations vidéo pour l'API"""
    formats = []
    
    # Traiter les formats disponibles
    if 'formats' in info:
        for fmt in info['formats']:
            if fmt.get('url'):
                format_info = {
                    'format_id': fmt.get('format_id', ''),
                    'ext': fmt.get('ext', 'mp4'),
                    'quality': fmt.get('quality', ''),
                    'filesize': fmt.get('filesize'),
                    'width': fmt.get('width'),
                    'height': fmt.get('height'),
                    'fps': fmt.get('fps'),
                    'acodec': fmt.get('acodec'),
                    'vcodec': fmt.get('vcodec'),
                    'format_note': fmt.get('format_note', ''),
                    'url': fmt.get('url')
                }
                formats.append(format_info)
    
    # Extraire les meilleures qualités
    video_formats = [f for f in formats if f.get('vcodec') != 'none']
    audio_formats = [f for f in formats if f.get('acodec') != 'none' and f.get('vcodec') == 'none']
    
    return VideoInfo(
        id=info.get('id', ''),
        title=info.get('title', 'Titre non disponible'),
        thumbnail=info.get('thumbnail', ''),
        duration=info.get('duration'),
        uploader=info.get('uploader'),
        view_count=info.get('view_count'),
        upload_date=info.get('upload_date'),
        formats=formats[:10],  # Limiter à 10 formats
        platform=detect_platform(info.get('webpage_url', '')),
        webpage_url=info.get('webpage_url', '')
    )

# Routes API

@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    """Vérification de santé de l'API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/info")
async def get_video_info(url: str = Query(..., description="URL de la vidéo")):
    """Obtient les informations d'une vidéo sans la télécharger"""
    
    # Vérifier le cache
    cache_key = get_cache_key(url)
    cached_info = metadata_cache.get(cache_key)
    
    if cached_info and is_cache_valid(cached_info):
        logger.info(f"Cache hit for URL: {url}")
        return cached_info['data']
    
    try:
        with yt_dlp.YoutubeDL(get_ytdl_options()) as ydl:
            # Extraire les informations sans télécharger
            info = ydl.extract_info(url, download=False)
            
            if not info:
                raise HTTPException(status_code=400, detail="Impossible d'extraire les informations de la vidéo")
            
            video_info = format_video_info(info)
            
            # Mettre en cache
            metadata_cache[cache_key] = {
                'data': video_info.dict(),
                'cached_at': time.time()
            }
            
            return video_info
            
    except DownloadError as e:
        logger.error(f"Erreur yt-dlp: {e}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de l'extraction: {str(e)}")
    except Exception as e:
        logger.error(f"Erreur inattendue: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@app.post("/api/download")
async def download_video(
    request: DownloadRequest,
    background_tasks: BackgroundTasks
):
    """Démarre le téléchargement d'une vidéo"""
    
    download_id = str(uuid.uuid4())
    url = str(request.url)
    
    # Initialiser le statut de téléchargement
    download_cache[download_id] = {
        'status': 'started',
        'progress': 0,
        'message': 'Téléchargement démarré',
        'url': url,
        'created_at': time.time()
    }
    
    # Lancer le téléchargement en arrière-plan
    background_tasks.add_task(
        perform_download,
        download_id,
        url,
        request.format_id,
        request.quality
    )
    
    return DownloadResponse(
        download_id=download_id,
        status="started",
        message="Téléchargement démarré"
    )

@app.get("/api/download/{download_id}/status")
async def get_download_status(download_id: str = Path(..., description="ID du téléchargement")):
    """Obtient le statut d'un téléchargement"""
    
    if download_id not in download_cache:
        raise HTTPException(status_code=404, detail="Téléchargement non trouvé")
    
    download_info = download_cache[download_id]
    
    return DownloadResponse(
        download_id=download_id,
        status=download_info['status'],
        message=download_info['message'],
        progress=download_info.get('progress'),
        file_path=download_info.get('file_path'),
        file_size=download_info.get('file_size')
    )

@app.get("/api/download/{download_id}/file")
async def download_file(download_id: str = Path(..., description="ID du téléchargement")):
    """Télécharge le fichier"""
    
    if download_id not in download_cache:
        raise HTTPException(status_code=404, detail="Téléchargement non trouvé")
    
    download_info = download_cache[download_id]
    
    if download_info['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Téléchargement non terminé")
    
    file_path = download_info.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    filename = os.path.basename(file_path)
    return FileResponse(
        file_path,
        media_type='application/octet-stream',
        filename=filename
    )

@app.get("/api/supported-sites")
async def get_supported_sites():
    """Retourne la liste des sites supportés"""
    
    # Sites principaux supportés par yt-dlp
    sites = [
        {"name": "YouTube", "domain": "youtube.com", "icon": "fab fa-youtube"},
        {"name": "Instagram", "domain": "instagram.com", "icon": "fab fa-instagram"},
        {"name": "TikTok", "domain": "tiktok.com", "icon": "fab fa-tiktok"},
        {"name": "Facebook", "domain": "facebook.com", "icon": "fab fa-facebook"},
        {"name": "Twitter", "domain": "twitter.com", "icon": "fab fa-twitter"},
        {"name": "Vimeo", "domain": "vimeo.com", "icon": "fab fa-vimeo"},
        {"name": "Dailymotion", "domain": "dailymotion.com", "icon": "fas fa-video"},
        {"name": "Twitch", "domain": "twitch.tv", "icon": "fab fa-twitch"},
        {"name": "Reddit", "domain": "reddit.com", "icon": "fab fa-reddit"},
        {"name": "SoundCloud", "domain": "soundcloud.com", "icon": "fab fa-soundcloud"},
    ]
    
    return {
        "supported_sites": sites,
        "total_sites": len(sites),
        "note": "Cette liste n'est pas exhaustive. yt-dlp supporte plus de 1000 sites."
    }

@app.delete("/api/download/{download_id}")
async def delete_download(download_id: str = Path(..., description="ID du téléchargement")):
    """Supprime un téléchargement et son fichier"""
    
    if download_id not in download_cache:
        raise HTTPException(status_code=404, detail="Téléchargement non trouvé")
    
    download_info = download_cache[download_id]
    
    # Supprimer le fichier si il existe
    file_path = download_info.get('file_path')
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info(f"Fichier supprimé: {file_path}")
        except Exception as e:
            logger.error(f"Erreur lors de la suppression: {e}")
    
    # Supprimer du cache
    del download_cache[download_id]
    
    return {"message": "Téléchargement supprimé"}

async def perform_download(download_id: str, url: str, format_id: str, quality: str):
    """Fonction pour effectuer le téléchargement en arrière-plan"""
    
    def progress_hook(d):
        """Hook de progression pour yt-dlp"""
        if d['status'] == 'downloading':
            progress = 0
            if d.get('total_bytes'):
                progress = (d['downloaded_bytes'] / d['total_bytes']) * 100
            elif d.get('total_bytes_estimate'):
                progress = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100
            
            download_cache[download_id].update({
                'status': 'downloading',
                'progress': round(progress, 1),
                'message': f'Téléchargement en cours... {progress:.1f}%'
            })
        
        elif d['status'] == 'finished':
            download_cache[download_id].update({
                'status': 'processing',
                'progress': 100,
                'message': 'Traitement final...',
                'file_path': d['filename'],
                'file_size': os.path.getsize(d['filename']) if os.path.exists(d['filename']) else None
            })
    
    try:
        # Configuration yt-dlp avec hook de progression
        options = get_ytdl_options(DOWNLOAD_DIR)
        options['progress_hooks'] = [progress_hook]
        
        # Adapter le format selon la qualité demandée
        if quality == 'audio':
            options['format'] = 'bestaudio/best'
            options['outtmpl'] = os.path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s')
        elif quality == 'video':
            options['format'] = 'best[ext=mp4]/best'
        
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url])
        
        # Marquer comme terminé
        download_cache[download_id].update({
            'status': 'completed',
            'progress': 100,
            'message': 'Téléchargement terminé'
        })
        
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement {download_id}: {e}")
        download_cache[download_id].update({
            'status': 'error',
            'progress': 0,
            'message': f'Erreur: {str(e)}'
        })

# Tâche de nettoyage périodique
@app.on_event("startup")
async def startup_event():
    """Tâches de démarrage"""
    logger.info("Démarrage du serveur SaveFrom.net Clone")
    clean_old_files()

@app.on_event("shutdown")
async def shutdown_event():
    """Tâches d'arrêt"""
    logger.info("Arrêt du serveur")
    clean_old_files()

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        access_log=True
    )