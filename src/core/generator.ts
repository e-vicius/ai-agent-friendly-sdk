import fs from 'fs-extra';
import path from 'path';

export class Generator {
    private outputDir: string;

    constructor(outputDir: string) {
        this.outputDir = outputDir;
    }

    async savePage(slug: string, content: string): Promise<string> {
        const fileName = `${slug.replace(/^\//, '').replace(/\//g, '_') || 'index'}.md`;
        const filePath = path.join(this.outputDir, fileName);

        await fs.ensureDir(this.outputDir);
        await fs.writeFile(filePath, content, 'utf-8');

        return filePath;
    }

    async generateLlmTxt(pages: { path: string, filePath: string }[]): Promise<void> {
        // llms.txt format: https://llmstxt.org/ (Draft) or similar
        // Simple implementation: List of files

        const lines = [
            '# AI Agent Map',
            '',
            ...pages.map(p => {
                const relativePath = path.relative(path.dirname(this.outputDir), p.filePath); // approximate relative path from public root if possible
                // Assuming outputDir is public/ai, we want /ai/filename.md
                const webPath = `/ai/${path.basename(p.filePath)}`;
                return `- [${p.path}](${webPath}): Content for ${p.path}`;
            })
        ];

        await fs.writeFile(path.join(path.dirname(this.outputDir), 'llms.txt'), lines.join('\n'), 'utf-8');
    }

    async generateRobotsSnippet(pages: { filePath: string }[]): Promise<string> {
        // Return a string to be manually added or appended
        return `
# AI Agent Friendly Content
User-agent: *
${pages.map(p => `Allow: /ai/${path.basename(p.filePath)}`).join('\n')}
    `.trim();
    }
}
