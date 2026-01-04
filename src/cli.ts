#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk'; // Ensure chalk v4 is used if CJS, or simple console logs if ESM issues
import { loadConfig } from './config';
import { Fetcher } from './core/fetcher';
import { Processor } from './core/processor';
import { CacheManager } from './core/cache';
import { Generator } from './core/generator';
import path from 'path';

const program = new Command();

program
    .name('ai-sdk')
    .description('SDK to generate AI-agent friendly pages for Next.js')
    .version('1.0.0');

program
    .command('init')
    .description('Initialize the SDK configuration')
    .action(async () => {
        const configContent = `module.exports = {
    baseUrl: 'http://localhost:3000',
    pages: ['/'],
    outputDir: './public/ai',
    model: 'gemini-2.5-pro' // or 'gemini-2.0-flash'
};`;

        try {
            const fs = require('fs-extra');
            if (await fs.pathExists('ai-sdk.config.js')) {
                console.log(chalk.yellow('⚠️  ai-sdk.config.js already exists. Skipping.'));
            } else {
                await fs.writeFile('ai-sdk.config.js', configContent);
                console.log(chalk.green('✅ Created ai-sdk.config.js'));
            }

            console.log(chalk.cyan('\nNext Step: Add GEMINI_API_KEY to your .env file and run "npx ai-sdk build"'));
        } catch (e: any) {
            console.error(chalk.red('Error creating config: ' + e.message));
        }
    });

program
    .command('build')
    .description('Build AI-friendly pages from existing routes')
    .option('-c, --config <path>', 'Path to configuration file', 'ai-sdk.config.js')
    .action(async (options) => {
        try {
            console.log(chalk.blue('🚀 Starting AI SDK Build...'));

            // 1. Load Config
            const config = await loadConfig(options.config);

            if (!config.geminiApiKey) {
                console.error(chalk.red('Error: GEMINI_API_KEY is not set.'));
                process.exit(1);
            }

            const fetcher = new Fetcher(config.baseUrl);
            const processor = new Processor(config.geminiApiKey, config.model);
            const cacheManager = new CacheManager();
            const generator = new Generator(config.outputDir);

            const generatedPages: { path: string, filePath: string }[] = [];

            // 2. Process Pages
            for (const pagePath of config.pages) {
                console.log(chalk.yellow(`\nProcessing ${pagePath}...`));

                try {
                    const originalHtml = await fetcher.fetchPage(pagePath);

                    // Check Cache
                    let finalContent = cacheManager.getCached(pagePath, originalHtml);

                    if (finalContent) {
                        console.log(chalk.green(`  ✨ Cache hit for ${pagePath}`));
                    } else {
                        console.log(chalk.gray(`  ⚡ Translating and Optimizing (Gemini)...`));
                        finalContent = await processor.processAndTranslate(originalHtml);

                        // Update Cache
                        cacheManager.set(pagePath, originalHtml, finalContent);
                    }

                    // 3. Save Output
                    const savedPath = await generator.savePage(pagePath, finalContent);
                    generatedPages.push({ path: pagePath, filePath: savedPath });
                    console.log(chalk.green(`  ✅ Saved to ${savedPath}`));

                } catch (err: any) {
                    console.error(chalk.red(`  ❌ Failed to process ${pagePath}: ${err.message}`));
                }
            }

            // 4. Generate Metadata
            console.log(chalk.blue('\nGenerating Metadata...'));
            await generator.generateLlmTxt(generatedPages);
            const robots = await generator.generateRobotsSnippet(generatedPages);

            console.log(chalk.cyan('\nAdd this to your robots.txt:'));
            console.log(robots);

            console.log(chalk.blue('\n🎉 Build Complete!'));

        } catch (error: any) {
            console.error(chalk.red('Fatal Error:'), error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
