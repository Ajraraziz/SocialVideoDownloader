# Social Video Downloader

Un outil web moderne pour télécharger des vidéos depuis les réseaux sociaux populaires.

## 🌟 Fonctionnalités

- **Multi-plateformes** : YouTube, Instagram, TikTok, Facebook, Twitter
- **Interface moderne** : Design responsive et intuitif
- **Qualités multiples** : Choix de la qualité de téléchargement
- **Historique** : Sauvegarde des téléchargements récents
- **Alternatives automatiques** : Services de secours si le téléchargement principal échoue
- **PWA (Progressive Web App)** : Installable sur mobile et fonctionne hors ligne
- **Optimisation mobile** : Interface adaptée aux écrans tactiles

## 📱 Optimisations Mobile

### 🎯 Interface Adaptative
- **Design responsive** : S'adapte à tous les écrans (320px à 4K)
- **Zones de toucher optimisées** : Boutons de 44px minimum pour faciliter l'utilisation
- **Gestion du clavier virtuel** : Évite le zoom automatique sur iOS
- **Orientation dynamique** : S'adapte au mode portrait et paysage

### ⚡ Performance Mobile
- **Animations optimisées** : Transitions fluides même sur les appareils moins puissants
- **Chargement rapide** : Service worker pour la mise en cache
- **Écrans haute densité** : Icônes et images optimisées pour les écrans Retina

### 🔧 Fonctionnalités PWA
- **Installation native** : Ajout à l'écran d'accueil sur mobile
- **Mode hors ligne** : Fonctionne même sans connexion internet
- **Mises à jour automatiques** : Notifications de nouvelles versions
- **Icônes adaptatives** : Icônes masquables pour tous les appareils

### 📐 Breakpoints Responsive
- **Desktop** : > 768px - Layout en grille avec sidebar
- **Tablet** : 768px - Layout adaptatif avec boutons en grille
- **Mobile** : 480px - Layout vertical optimisé
- **Small Mobile** : 360px - Interface ultra-compacte

## 🚀 Déploiement sur GitHub Pages

### Méthode 1 : Déploiement automatique
1. Forkez ce repository
2. Allez dans Settings > Pages
3. Sélectionnez "Deploy from a branch"
4. Choisissez la branche `main` et le dossier `/ (root)`
5. Cliquez sur "Save"

### Méthode 2 : Déploiement manuel
```bash
# Clonez le repository
git clone https://github.com/votre-username/social-video-downloader.git

# Ajoutez vos fichiers
git add .
git commit -m "Initial commit"
git push origin main
```

## ⚠️ Limitations sur GitHub Pages

**Important** : GitHub Pages ne peut pas exécuter de serveur backend. Cette application utilise donc :

1. **APIs externes** pour le téléchargement direct
2. **Services alternatifs** en cas d'échec
3. **Redirection vers des sites tiers** pour certains téléchargements

### Pourquoi les vidéos ne se téléchargent pas directement ?

- **CORS** : Les navigateurs bloquent les téléchargements directs depuis les réseaux sociaux
- **Politiques de sécurité** : Les sites sociaux empêchent le scraping
- **GitHub Pages statique** : Pas de serveur pour traiter les requêtes

### Solutions incluses :

✅ **Téléchargement direct** via APIs externes  
✅ **Services alternatifs** (SaveFrom.net, Y2Mate, etc.)  
✅ **Redirection automatique** vers des sites de téléchargement  
✅ **Notifications d'erreur** avec alternatives  

## 📱 Utilisation

1. **Collez l'URL** de la vidéo que vous voulez télécharger
2. **Sélectionnez la plateforme** (détection automatique)
3. **Choisissez la qualité** souhaitée
4. **Cliquez sur "Télécharger"**
5. **Suivez les instructions** si des alternatives s'ouvrent

## 🛠️ Développement local

Pour tester avec un serveur backend :

```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm start

# Ou utiliser les scripts batch (Windows)
start.bat
```

## 📋 Plateformes supportées

| Plateforme | Statut | Notes |
|------------|--------|-------|
| YouTube | ✅ | Téléchargement direct + alternatives |
| Instagram | ✅ | Via services tiers |
| TikTok | ✅ | Via services tiers |
| Facebook | ✅ | Via services tiers |
| Twitter | ✅ | Via services tiers |

## 🔧 Configuration

### Variables d'environnement (optionnel)
```env
PORT=3000
NODE_ENV=production
```

### Personnalisation
- Modifiez `styles.css` pour changer l'apparence
- Ajustez `script.js` pour ajouter de nouvelles plateformes
- Configurez les APIs dans `downloadWithBackend()`

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles plateformes
- Améliorer la documentation

## ⚖️ Avertissement légal

Cet outil est destiné à un usage personnel et éducatif uniquement. Assurez-vous de respecter :
- Les conditions d'utilisation des plateformes
- Les droits d'auteur
- Les lois locales sur le téléchargement de contenu

L'utilisateur est responsable de l'utilisation qu'il fait de cet outil. 