import { EmbedBuilder } from 'discord.js';

export class NotificationService {
    constructor(client, syncConfig, webPath) {
        this.client = client;
        this.syncConfig = syncConfig;
        this.webPath = webPath;
    }

    async send(videoData, source = 'web') {
        const channelId = this.syncConfig.getChannelId();
        if (!channelId) return;

        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) return;

            const filename = `${videoData.author}_${videoData.id}.mp4`;
            const videoLink = `${this.webPath}/downloads/${filename}`;

            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('🎵 Nouveau téléchargement TikTok')
                .addFields(
                    { name: '📍 Source', value: source === 'web' ? '🌐 Interface Web' : '🤖 Bot Discord', inline: true },
                    { name: '👤 Auteur', value: `@${videoData.author}`, inline: true },
                    { name: '🆔 Video ID', value: videoData.id, inline: true },
                    { name: '🔗 Lien téléchargement', value: `[Cliquez ici](${videoLink})`, inline: false }
                )
                .setTimestamp();

            if (videoData.desc) {
                embed.setDescription(videoData.desc.substring(0, 200));
            }

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}