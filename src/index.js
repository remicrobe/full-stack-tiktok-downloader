import express from 'express';
import fs from 'fs';
import cron from 'node-cron';
import { config } from './config/config.js';
import { VideoRegistry, SyncConfig } from './utils/storage.js';
import { NotificationService } from './services/notificationService.js';
import { createBot, setupBot } from './discord/bot.js';
import { setupRoutes } from './web/routes.js';

// Initialisation Express
const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/downloads', express.static(config.downloads.dir));

// Initialisation des services
const videoRegistry = new VideoRegistry();
const syncConfig = new SyncConfig();

// Créer les dossiers nécessaires
if (!fs.existsSync(config.downloads.dir)) {
    fs.mkdirSync(config.downloads.dir, { recursive: true });
}

// Charger les configurations
videoRegistry.load();
syncConfig.load();

// Initialisation du bot Discord
const client = createBot(config);
const notificationService = new NotificationService(client, syncConfig, config.web.path);

// Configuration des routes web
setupRoutes(app, config, videoRegistry, notificationService);

// Configuration du bot Discord
setupBot(client, config, videoRegistry, syncConfig, notificationService);

// Configurer le cron job pour nettoyer toutes les heures
cron.schedule('0 * * * *', () => {
    console.log('Running scheduled cleanup...');
    videoRegistry.cleanupExpired(config.downloads.lifetimeHours);
});

// Démarrer le serveur web
app.listen(config.web.port, () => {
    console.log(`✓ Web server started on port ${config.web.port}`);
});

// Lancer le bot Discord
client.login(config.discord.token);