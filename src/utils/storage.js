import fs from 'fs';

export class VideoRegistry {
    constructor() {
        this.registry = new Map();
        this.registryFile = './video_registry.json';
    }

    register(filePath) {
        this.registry.set(filePath, Date.now());
        this.save();
    }

    save() {
        const data = Array.from(this.registry.entries());
        fs.writeFileSync(this.registryFile, JSON.stringify(data, null, 2));
    }

    load() {
        try {
            if (fs.existsSync(this.registryFile)) {
                const data = JSON.parse(fs.readFileSync(this.registryFile, 'utf8'));
                this.registry.clear();
                data.forEach(([path, timestamp]) => this.registry.set(path, timestamp));
            }
        } catch (error) {
            console.error('Error loading registry:', error);
        }
    }

    cleanupExpired(lifetimeHours) {
        const now = Date.now();
        const expirationTime = lifetimeHours * 60 * 60 * 1000;
        let deletedCount = 0;

        this.registry.forEach((timestamp, filePath) => {
            if (now - timestamp > expirationTime) {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`✓ Deleted expired video: ${filePath}`);
                        deletedCount++;
                    }
                    this.registry.delete(filePath);
                } catch (error) {
                    console.error(`Error deleting ${filePath}:`, error);
                }
            }
        });

        if (deletedCount > 0) {
            this.save();
            console.log(`✓ Cleanup completed: ${deletedCount} videos deleted`);
        }
    }
}

export class SyncConfig {
    constructor() {
        this.channelId = null;
        this.configFile = './sync_config.json';
    }

    load() {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.channelId = config.channelId;
            }
        } catch (error) {
            console.error('Error loading sync config:', error);
        }
    }

    save() {
        fs.writeFileSync(this.configFile, JSON.stringify({ channelId: this.channelId }, null, 2));
    }

    setChannelId(channelId) {
        this.channelId = channelId;
        this.save();
    }

    getChannelId() {
        return this.channelId;
    }
}