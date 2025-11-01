import express from 'express';
import path from 'path';
import fs from 'fs';
import { extractVideoId, getUserVideos, getVideoDataFromAPI, downloadVideo } from '../utils/tiktok.js';
import { getHomePage } from './views/home.js';

export function setupRoutes(app, config, videoRegistry, notificationService) {
    app.get('/', (req, res) => {
        res.send(getHomePage(config.web.port, config.downloads.lifetimeHours));
    });

    app.post('/api/download', async (req, res) => {
        const { url, type } = req.body;

        try {
            if (type === 'single') {
                const result = await handleSingleDownload(url, config, videoRegistry, notificationService);
                res.json(result);
            } else if (type === 'user') {
                const result = await handleUserDownload(url, config, videoRegistry, notificationService);
                res.json(result);
            }
        } catch (error) {
            console.error('Error:', error);
            res.json({ success: false, error: error.message });
        }
    });
}

async function handleSingleDownload(url, config, videoRegistry, notificationService) {
    const videoId = extractVideoId(url);
    if (!videoId) {
        return { success: false, error: 'URL invalide' };
    }

    const videoData = await getVideoDataFromAPI(videoId, false);
    const filename = `${videoData.author}_${videoId}.mp4`;
    const outputPath = path.join(config.downloads.dir, filename);

    await downloadVideo(videoData.url, outputPath);
    videoRegistry.register(outputPath);

    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    await notificationService.send(videoData, 'web');

    return {
        success: true,
        video: {
            filename,
            author: videoData.author,
            id: videoId,
            size: `${fileSizeMB} MB`
        }
    };
}

async function handleUserDownload(url, config, videoRegistry, notificationService) {
    const username = url.replace('@', '');
    const videoLinks = await getUserVideos(username);

    if (videoLinks.length === 0) {
        return { success: false, error: 'Aucune vidéo trouvée' };
    }

    const videos = [];

    for (const link of videoLinks) {
        try {
            const videoId = extractVideoId(link);
            if (!videoId) continue;

            const filename = `${username}_${videoId}.mp4`;
            const outputPath = path.join(config.downloads.dir, filename);

            if (fs.existsSync(outputPath)) {
                const stats = fs.statSync(outputPath);
                videos.push({
                    filename,
                    author: username,
                    id: videoId,
                    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
                });
                continue;
            }

            const videoData = await getVideoDataFromAPI(videoId, false);
            await downloadVideo(videoData.url, outputPath);
            videoRegistry.register(outputPath);

            const stats = fs.statSync(outputPath);
            videos.push({
                filename,
                author: username,
                id: videoId,
                size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
            });

            await notificationService.send(videoData, 'web');
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`Error downloading video:`, error);
        }
    }

    return { success: true, videos };
}