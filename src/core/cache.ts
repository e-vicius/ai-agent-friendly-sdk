import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

interface CacheEntry {
    hash: string;
    content: string;
    timestamp: string;
    polishContent?: string;
}

interface CacheStore {
    [pagePath: string]: CacheEntry;
}

export class CacheManager {
    private cacheDir: string;
    private cacheFile: string;
    private cache: CacheStore = {};

    constructor(baseDir: string = '.next/cache/ai-sdk') {
        this.cacheDir = path.resolve(process.cwd(), baseDir);
        this.cacheFile = path.join(this.cacheDir, 'cache.json');
        this.loadCache();
    }

    private loadCache() {
        if (fs.existsSync(this.cacheFile)) {
            try {
                this.cache = fs.readJSONSync(this.cacheFile);
            } catch (error) {
                console.warn('Failed to load cache, starting fresh.', error);
                this.cache = {};
            }
        }
    }

    private saveCache() {
        fs.ensureDirSync(this.cacheDir);
        fs.writeJSONSync(this.cacheFile, this.cache, { spaces: 2 });
    }

    private generateHash(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    getCached(pagePath: string, content: string): string | null {
        const currentHash = this.generateHash(content);
        const entry = this.cache[pagePath];

        if (entry && entry.hash === currentHash && entry.polishContent) {
            return entry.polishContent;
        }

        return null;
    }

    set(pagePath: string, content: string, polishContent: string) {
        const hash = this.generateHash(content);
        this.cache[pagePath] = {
            hash,
            content, // Optionally store original content if needed for debugging
            timestamp: new Date().toISOString(),
            polishContent
        };
        this.saveCache();
    }
}
