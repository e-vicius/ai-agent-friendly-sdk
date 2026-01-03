import fetch from 'node-fetch';

export class Fetcher {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    }

    async fetchPage(path: string): Promise<string> {
        const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
        console.log(`Fetching ${url}...`);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            console.error(`Error fetching page ${path}:`, error);
            throw error;
        }
    }
}
