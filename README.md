# SaveFrom.net Clone 🎥

Un clone complet de SaveFrom.net avec interface moderne et API robuste pour télécharger des vidéos depuis plus de 1000 sites web.

## ✨ Fonctionnalités

- **🌐 Support multi-plateformes** : YouTube, Instagram, TikTok, Facebook, Twitter, Vimeo, Dailymotion, Twitch et plus de 1000 sites
- **🎯 Interface moderne** : Design responsive et intuitive inspirée de SaveFrom.net
- **⚡ API REST complète** : Endpoints pour l'intégration avec d'autres applications
- **📱 Mobile-friendly** : Interface adaptée aux mobiles et tablettes
- **🔄 Téléchargement en temps réel** : Suivi de progression en direct
- **🎨 Formats multiples** : Vidéo et audio dans différentes qualités
- **🔧 Cache intelligent** : Système de cache pour améliorer les performances
- **📊 Métadonnées complètes** : Titre, thumbnail, durée, vues, etc.

## � Installation rapide

### Option 1: Docker (Recommandé)

```bash
# Cloner le projet
git clone https://github.com/votre-username/savefrom-clone.git
cd savefrom-clone

# Lancer avec Docker Compose
docker-compose up -d

# Accéder à l'application
open http://localhost:8000
```

### Option 2: Installation manuelle

```bash
# Cloner le projet
git clone https://github.com/votre-username/savefrom-clone.git
cd savefrom-clone

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt

# Installer FFmpeg (requis pour la conversion audio)
# Ubuntu/Debian:
sudo apt-get install ffmpeg

# macOS:
brew install ffmpeg

# Windows: télécharger depuis https://ffmpeg.org/

# Lancer l'application
python app.py
```

## � Utilisation

### Interface Web

1. **Accéder à l'application** : http://localhost:8000
2. **Coller une URL** : Collez l'URL de la vidéo dans le champ de saisie
3. **Sélectionner la plateforme** : Choisissez la plateforme ou laissez en mode "Auto"
4. **Analyser** : Cliquez sur "Analyser" pour extraire les informations
5. **Choisir le format** : Sélectionnez vidéo ou audio seul
6. **Télécharger** : Cliquez sur le bouton de téléchargement du format souhaité

### API REST

#### Obtenir les informations d'une vidéo

```bash
curl -X GET "http://localhost:8000/api/info?url=https://youtube.com/watch?v=dQw4w9WgXcQ"
```

#### Démarrer un téléchargement

```bash
curl -X POST "http://localhost:8000/api/download" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "quality": "best"
  }'
```

#### Vérifier le statut d'un téléchargement

```bash
curl -X GET "http://localhost:8000/api/download/{download_id}/status"
```

#### Télécharger le fichier

```bash
curl -X GET "http://localhost:8000/api/download/{download_id}/file" -o video.mp4
```

## 🛠️ Configuration

### Variables d'environnement

```bash
# Port du serveur (défaut: 8000)
PORT=8000

# Répertoire des téléchargements
DOWNLOAD_DIR=/app/downloads

# Répertoire du cache
CACHE_DIR=/app/cache

# Durée du cache en secondes (défaut: 3600)
CACHE_DURATION=3600

# Niveau de log (défaut: INFO)
LOG_LEVEL=INFO
```

### Personnalisation

1. **Modifier les couleurs** : Editez `/static/css/style.css`
2. **Ajouter des sites** : Modifiez la fonction `get_supported_sites()` dans `app.py`
3. **Personnaliser l'interface** : Editez `/static/index.html`

## 🔧 Architecture technique

### Backend (Python/FastAPI)

- **FastAPI** : Framework web moderne et performant
- **yt-dlp** : Moteur de téléchargement supporting 1000+ sites
- **Pydantic** : Validation des données et sérialisation
- **uvicorn** : Serveur ASGI haute performance

### Frontend (HTML/CSS/JavaScript)

- **HTML5** : Structure sémantique moderne
- **CSS3** : Design responsive avec variables CSS
- **JavaScript ES6+** : Interactions dynamiques et API calls
- **Font Awesome** : Icônes vectorielles
- **Google Fonts** : Typographie moderne

### Fonctionnalités avancées

- **Cache intelligent** : Mise en cache des métadonnées
- **Téléchargement asynchrone** : Traitement en arrière-plan
- **Polling temps réel** : Suivi de progression
- **Gestion d'erreurs** : Retry automatique et fallback
- **Nettoyage automatique** : Suppression des fichiers temporaires

## 🌍 Sites supportés

Le projet supporte plus de 1000 sites grâce à yt-dlp, incluant :

### Plateformes vidéo populaires
- **YouTube** : Vidéos, Shorts, livestreams
- **Instagram** : Posts, Reels, IGTV, Stories
- **TikTok** : Vidéos courtes et lives
- **Facebook** : Vidéos publiques et Watch
- **Twitter/X** : Vidéos et GIFs
- **Vimeo** : Vidéos professionnelles
- **Dailymotion** : Plateforme française
- **Twitch** : Clips et VODs

### Autres sites
- Reddit, SoundCloud, Bandcamp
- BBC iPlayer, Arte, France TV
- Streamable, Imgur, Giphy
- Et bien d'autres...

## 📚 Documentation API

### Endpoints principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/` | GET | Page d'accueil |
| `/health` | GET | Vérification de santé |
| `/api/info` | GET | Informations vidéo |
| `/api/download` | POST | Démarrer téléchargement |
| `/api/download/{id}/status` | GET | Statut du téléchargement |
| `/api/download/{id}/file` | GET | Télécharger le fichier |
| `/api/supported-sites` | GET | Sites supportés |
| `/docs` | GET | Documentation Swagger |

### Modèles de données

```python
class VideoInfo(BaseModel):
    id: str
    title: str
    thumbnail: str
    duration: Optional[int]
    uploader: Optional[str]
    view_count: Optional[int]
    upload_date: Optional[str]
    formats: List[Dict]
    platform: str
    webpage_url: str

class DownloadRequest(BaseModel):
    url: HttpUrl
    format_id: Optional[str] = "best"
    quality: Optional[str] = "best"
```

## � Déploiement

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  savefrom-clone:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./downloads:/app/downloads
      - ./cache:/app/cache
    environment:
      - PYTHONPATH=/app
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
```

### Nginx (Proxy inverse)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    client_max_body_size 100M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

## � Sécurité

- **Validation des URLs** : Vérification stricte des entrées
- **Limitation des requêtes** : Protection contre les abus
- **Nettoyage automatique** : Suppression des fichiers temporaires
- **Headers sécurisés** : Protection contre les attaques communes
- **Pas de stockage permanent** : Fichiers supprimés après téléchargement

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## ⚖️ Avertissement légal

Ce projet est à des fins éducatives et personnelles uniquement. Assurez-vous de respecter les conditions d'utilisation des sites web et les lois sur le droit d'auteur de votre pays.

## 🆘 Support

- **Issues** : [GitHub Issues](https://github.com/votre-username/savefrom-clone/issues)
- **Discussions** : [GitHub Discussions](https://github.com/votre-username/savefrom-clone/discussions)
- **Email** : support@votre-domaine.com

## 🚧 Roadmap

- [ ] Authentification utilisateur
- [ ] Historique des téléchargements
- [ ] Téléchargement par lots
- [ ] Support des playlists
- [ ] API GraphQL
- [ ] Application mobile
- [ ] Intégration cloud storage
- [ ] Transcription automatique

## 📊 Statistiques

- **Sites supportés** : 1000+
- **Formats vidéo** : MP4, WebM, FLV, MKV
- **Formats audio** : MP3, AAC, OGG, FLAC
- **Qualités** : 144p à 8K
- **Taille max** : Illimitée

---

**Fait avec ❤️ par [Votre nom]** 