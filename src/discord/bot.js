import { Client, GatewayIntentBits } from 'discord.js';
import {setupCommands} from "./command.js";

export function createBot(config) {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    return client;
}

export function setupBot(client, config, videoRegistry, syncConfig, notificationService) {
    client.once('ready', () => {
        console.log(`✓ Bot connecté en tant que ${client.user.tag}`);
        console.log(`✓ Web server: http://localhost:${config.web.port}`);
        console.log(`✓ Durée de vie des vidéos: ${config.downloads.lifetimeHours}h`);
        if (syncConfig.getChannelId()) {
            console.log(`✓ Canal synchronisé: ${syncConfig.getChannelId()}`);
        }
        console.log('✓ En attente de commandes...\n');
    });

    setupCommands(client, config, videoRegistry, syncConfig, notificationService);
}