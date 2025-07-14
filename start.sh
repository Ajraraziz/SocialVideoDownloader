#!/bin/bash

# SaveFrom.net Clone - Script de démarrage
# Ce script facilite le lancement du serveur avec différentes options

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          SaveFrom.net Clone                                       ║"
    echo "║                     Téléchargeur de vidéos universel                             ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des dépendances
check_dependencies() {
    print_info "Vérification des dépendances..."
    
    # Vérifier Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 n'est pas installé"
        exit 1
    fi
    
    # Vérifier pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 n'est pas installé"
        exit 1
    fi
    
    # Vérifier FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
        print_warning "FFmpeg n'est pas installé. Certaines fonctionnalités pourraient ne pas fonctionner."
        echo "          Installez FFmpeg avec:"
        echo "          - Ubuntu/Debian: sudo apt-get install ffmpeg"
        echo "          - macOS: brew install ffmpeg"
        echo "          - Windows: Téléchargez depuis https://ffmpeg.org/"
    fi
    
    print_success "Dépendances vérifiées"
}

# Installation des dépendances Python
install_dependencies() {
    print_info "Installation des dépendances Python..."
    
    # Créer un environnement virtuel si il n'existe pas
    if [ ! -d "venv" ]; then
        print_info "Création de l'environnement virtuel..."
        python3 -m venv venv
    fi
    
    # Activer l'environnement virtuel
    source venv/bin/activate
    
    # Installer les dépendances
    pip install -r requirements.txt
    
    print_success "Dépendances installées"
}

# Démarrage du serveur
start_server() {
    local port=${1:-8000}
    local host=${2:-"0.0.0.0"}
    local workers=${3:-1}
    
    print_info "Démarrage du serveur..."
    print_info "Port: $port"
    print_info "Host: $host"
    print_info "Workers: $workers"
    
    # Activer l'environnement virtuel
    source venv/bin/activate
    
    # Démarrer le serveur
    uvicorn app:app --host $host --port $port --workers $workers --reload
}

# Démarrage avec Docker
start_docker() {
    print_info "Démarrage avec Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Construire et démarrer les conteneurs
    docker-compose up --build -d
    
    print_success "Serveur démarré avec Docker"
    print_info "Application accessible sur: http://localhost:8000"
}

# Arrêt du serveur Docker
stop_docker() {
    print_info "Arrêt des conteneurs Docker..."
    docker-compose down
    print_success "Conteneurs arrêtés"
}

# Nettoyage des fichiers temporaires
cleanup() {
    print_info "Nettoyage des fichiers temporaires..."
    
    # Supprimer les fichiers de téléchargement
    if [ -d "downloads" ]; then
        rm -rf downloads/*
        print_success "Fichiers de téléchargement supprimés"
    fi
    
    # Supprimer le cache
    if [ -d "cache" ]; then
        rm -rf cache/*
        print_success "Cache supprimé"
    fi
    
    # Supprimer les logs
    if [ -f "app.log" ]; then
        rm app.log
        print_success "Logs supprimés"
    fi
}

# Mise à jour des dépendances
update_dependencies() {
    print_info "Mise à jour des dépendances..."
    
    # Activer l'environnement virtuel
    source venv/bin/activate
    
    # Mettre à jour pip
    pip install --upgrade pip
    
    # Mettre à jour les dépendances
    pip install --upgrade -r requirements.txt
    
    print_success "Dépendances mises à jour"
}

# Vérification de la santé du serveur
health_check() {
    local port=${1:-8000}
    
    print_info "Vérification de la santé du serveur..."
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        print_success "Serveur en bonne santé"
    else
        print_error "Serveur non accessible"
        exit 1
    fi
}

# Affichage de l'aide
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  start [port] [host] [workers]  Démarre le serveur (défaut: 8000 0.0.0.0 1)"
    echo "  docker                         Démarre avec Docker"
    echo "  stop                           Arrête Docker"
    echo "  install                        Installe les dépendances"
    echo "  update                         Met à jour les dépendances"
    echo "  cleanup                        Nettoie les fichiers temporaires"
    echo "  health [port]                  Vérifie la santé du serveur"
    echo "  check                          Vérifie les dépendances"
    echo "  help                           Affiche cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 start                       Démarre sur le port 8000"
    echo "  $0 start 3000                  Démarre sur le port 3000"
    echo "  $0 start 8000 localhost 2      Démarre sur localhost:8000 avec 2 workers"
    echo "  $0 docker                      Démarre avec Docker"
    echo "  $0 cleanup                     Nettoie les fichiers temporaires"
}

# Fonction principale
main() {
    print_banner
    
    case ${1:-start} in
        "start")
            check_dependencies
            install_dependencies
            start_server $2 $3 $4
            ;;
        "docker")
            start_docker
            ;;
        "stop")
            stop_docker
            ;;
        "install")
            check_dependencies
            install_dependencies
            ;;
        "update")
            update_dependencies
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            health_check $2
            ;;
        "check")
            check_dependencies
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
}

# Gestion des signaux
trap cleanup EXIT

# Exécution du script
main "$@"