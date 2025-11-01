import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { extractVideoId, getUserVideos, getVideoDataFromAPI, downloadVideo } from '../utils/tiktok.js';

export function setupCommands(client, config, videoRegistry, syncConfig, notificationService) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        const content = message.content.trim();

        if (content.startsWith('!sync')) {
            await handleSync(message, config, syncConfig);
        } else if (content.startsWith('!tiktok ')) {
            await handleTiktok(message, content, config, videoRegistry);
        } else if (content === '!help' || content === '!tiktok') {
            await handleHelp(message, config);
        }
    });
}

async function handleSync(message, config, syncConfig) {
    syncConfig.setChannelId(message.channel.id);

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Synchronisation activée')
        .setDescription(`Ce canal recevra les notifications de téléchargement depuis l'interface web.`)
        .addFields(
            { name: 'Canal', value: `<#${syncConfig.getChannelId()}>`, inline: true },
            { name: 'URL Web', value: `http://localhost:${config.web.port}`, inline: true }
        )
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}

async function handleTiktok(message, content, config, videoRegistry) {
    const input = content.slice(8).trim();

    if (!input) {
        return message.reply('❌ Veuillez fournir une URL TikTok ou un nom d\'utilisateur !');
    }

    const isUrl = input.includes('tiktok.com');

    if (isUrl) {
        await handleSingleVideo(message, input, config, videoRegistry);
    } else {
        await handleUserVideos(message, input, config, videoRegistry);
    }
}

async function handleHelp(message, config) {
    const embed = new EmbedBuilder()
        .setColor(0x00D9FF)
        .setTitle('🎵 TikTok Downloader Bot')
        .setDescription('Bot pour télécharger des vidéos TikTok')
        .addFields(
            { name: '📹 Télécharger une vidéo', value: '`!tiktok <URL_VIDEO>`\nExemple: `!tiktok https://www.tiktok.com/@user/video/123456`' },
            { name: '👤 Télécharger toutes les vidéos d\'un utilisateur', value: '`!tiktok <username>`\nExemple: `!tiktok username`' },
            { name: '🔗 Synchroniser avec l\'interface web', value: '`!sync` - Active les notifications dans ce canal' },
            { name: '🌐 Interface Web', value: `http://localhost:${config.web.port}` },
            { name: '⏰ Suppression automatique', value: `Les vidéos sont supprimées automatiquement après ${config.downloads.lifetimeHours} heures` }
        )
        .setFooter({ text: 'Les vidéos sont téléchargées sans watermark par défaut' });

    message.reply({ embeds: [embed] });
}

async function handleSingleVideo(message, url, config, videoRegistry) {
    const statusMsg = await message.reply('⏳ Téléchargement en cours...');

    try {
        const videoId = extractVideoId(url);
        if (!videoId) {
            return statusMsg.edit('❌ URL invalide ! Impossible d\'extraire l\'ID de la vidéo.');
        }

        const videoData = await getVideoDataFromAPI(videoId, false);
        const filename = `${videoData.author}_${videoId}.mp4`;
        const outputPath = path.join(config.downloads.dir, filename);

        await downloadVideo(videoData.url, outputPath);
        videoRegistry.register(outputPath);

        const stats = fs.statSync(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        if (stats.size > 8 * 1024 * 1024) {
            await statusMsg.edit(`✅ Vidéo téléchargée mais trop volumineuse (${fileSizeMB}MB) pour être envoyée sur Discord.\n📁 Fichier sauvegardé: \`${filename}\`\n🌐 Disponible sur: http://localhost:${config.web.port}/downloads/${filename}`);
            return;
        }

        const attachment = new AttachmentBuilder(outputPath);
        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('✅ Vidéo téléchargée')
            .addFields(
                { name: 'Auteur', value: `@${videoData.author}`, inline: true },
                { name: 'Taille', value: `${fileSizeMB} MB`, inline: true },
                { name: 'ID', value: videoId, inline: true }
            )
            .setFooter({ text: `Sera supprimée dans ${config.downloads.lifetimeHours}h` });

        if (videoData.desc) {
            embed.setDescription(videoData.desc.substring(0, 200));
        }

        await statusMsg.edit({ content: '', embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error('Error:', error);
        await statusMsg.edit(`❌ Erreur: ${error.message}`);
    }
}

async function handleUserVideos(message, username, config, videoRegistry) {
    username = username.replace('@', '');
    const statusMsg = await message.reply(`⏳ Récupération des vidéos de @${username}...`);

    try {
        const videoLinks = await getUserVideos(username);

        if (videoLinks.length === 0) {
            return statusMsg.edit('❌ Aucune vidéo trouvée pour cet utilisateur.');
        }

        await statusMsg.edit(`✅ ${videoLinks.length} vidéo(s) trouvée(s) ! Téléchargement en cours...\n⚠️ Cela peut prendre du temps.`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < videoLinks.length; i++) {
            try {
                const videoId = extractVideoId(videoLinks[i]);
                if (!videoId) continue;

                const filename = `${username}_${videoId}.mp4`;
                const outputPath = path.join(config.downloads.dir, filename);

                if (fs.existsSync(outputPath)) {
                    successCount++;
                    continue;
                }

                const videoData = await getVideoDataFromAPI(videoId, false);
                await downloadVideo(videoData.url, outputPath);
                videoRegistry.register(outputPath);

                const stats = fs.statSync(outputPath);
                if (stats.size <= 8 * 1024 * 1024) {
                    const attachment = new AttachmentBuilder(outputPath);
                    await message.channel.send({
                        content: `📹 **Vidéo ${i + 1}/${videoLinks.length}** - @${username}`,
                        files: [attachment]
                    });
                } else {
                    await message.channel.send(`📹 **Vidéo ${i + 1}/${videoLinks.length}** - Trop volumineuse pour Discord (${(stats.size / (1024 * 1024)).toFixed(2)}MB)\n🌐 Disponible sur: http://localhost:${config.web.port}/downloads/${filename}`);
                }

                successCount++;
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`Error downloading video ${i + 1}:`, error);
                failCount++;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Téléchargement terminé')
            .addFields(
                { name: 'Total', value: `${videoLinks.length}`, inline: true },
                { name: '✅ Réussis', value: `${successCount}`, inline: true },
                { name: '❌ Échoués', value: `${failCount}`, inline: true }
            )
            .setFooter({ text: `Vidéos supprimées automatiquement après ${config.downloads.lifetimeHours}h` });

        await message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Error:', error);
        await statusMsg.edit(`❌ Erreur: ${error.message}`);
    }
}