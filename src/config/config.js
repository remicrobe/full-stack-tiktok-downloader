import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
    discord: {
        token: process.env.DISCORD_TOKEN
    },
    downloads: {
        dir: process.env.DOWNLOADS_DIR || './downloads',
        lifetimeHours: parseInt(process.env.VIDEO_LIFETIME_HOURS) || 10
    },
    web: {
        port: parseInt(process.env.WEB_PORT) || 7888,
        path: process.env.WEB_DOMAIN || 'localhost',
    },
    paths: {
        __filename,
        __dirname
    }
};