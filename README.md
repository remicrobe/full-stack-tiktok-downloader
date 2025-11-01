```
# TikTok Downloader Bot

Bot Discord et interface web pour télécharger des vidéos TikTok sans watermark.

## Installation

1. Cloner le repository
2. Installer les dépendances:
```
npm install
```

3. Créer un fichier `.env` à la racine du projet avec les variables suivantes:
```
DISCORD_TOKEN=votre_token_discord
DOWNLOADS_DIR=./downloads
VIDEO_LIFETIME_HOURS=10
WEB_PORT=7888
```

4. Lancer le bot:
```
npm start
```

## Structure du projet
```
tiktok-downloader-bot/
├── src/
│   ├── config/
│   │   └── config.js          # Configuration centralisée
│   ├── discord/
│   │   ├── bot.js             # Initialisation du bot Discord
│   │   └── commands.js        # Commandes Discord
│   ├── services/
│   │   └── notificationService.js  # Service de notifications
│   ├── utils/
│   │   ├── tiktok.js          # Fonctions TikTok (scraping, API, téléchargement)
│   │   └── storage.js         # Gestion du stockage (registry, sync config)
│   ├── web/
│   │   ├── routes.js          # Routes Express
│   │   └── views/
│   │       └── home.js        # Page HTML principale
│   └── index.js               # Point d'entrée principal
├── .env                       # Variables d'environnement (non versionné)
├── .gitignore                 # Fichiers à ignorer
├── package.json               # Dépendances du projet
└── README.md                  # Documentation
```

## Commandes Discord

- `!help` - Affiche l'aide
- `!tiktok <URL>` - Télécharge une vidéo TikTok
- `!tiktok <username>` - Télécharge toutes les vidéos d'un utilisateur
- `!sync` - Synchronise le canal avec les notifications web

## Interface Web

Accessible sur `http://localhost:7888` (ou le port configuré dans `.env`)

## Fonctionnalités

- Téléchargement de vidéos TikTok sans watermark
- Téléchargement en masse des vidéos d'un utilisateur
- Interface web intuitive
- Notifications Discord des téléchargements web
- Suppression automatique des vidéos après X heures
- Gestion des vidéos volumineuses

## Variables d'environnement

- `DISCORD_TOKEN` - Token du bot Discord
- `DOWNLOADS_DIR` - Dossier de téléchargement (par défaut: ./downloads)
- `VIDEO_LIFETIME_HOURS` - Durée de vie des vidéos en heures (par défaut: 10)
- `WEB_DOMAIN` - Domain du serveur web (par défaut: localhost)
- `WEB_PORT` - Port du serveur web (par défaut: 7888)
```

## .env.example
```
# Token du bot Discord
DISCORD_TOKEN=votre_token_ici

# Dossier de téléchargement
DOWNLOADS_DIR=./downloads

# Durée de vie des vidéos en heures
VIDEO_LIFETIME_HOURS=10

# Port du serveur web
WEB_DOMAIN=localhost
WEB_PORT=7899