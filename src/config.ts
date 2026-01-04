import { z } from 'zod';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

export const ConfigSchema: z.ZodType<any> = z.object({
    baseUrl: z.string().url(),
    pages: z.array(z.string()),
    outputDir: z.string().default('./public/ai'),
    geminiApiKey: z.string().optional(),
    model: z.string().default('gemini-2.5-pro'),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function loadConfig(configPath: string = 'ai-sdk.config.js'): Promise<Config> {
    const fullPath = path.resolve(process.cwd(), configPath);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Configuration file not found at ${fullPath}`);
    }

    try {
        // Dynamic import for JS config files
        const userConfig = require(fullPath);

        // Merge with process.env if API key is missing in config but present in env
        const configToValidate = {
            ...userConfig,
            geminiApiKey: userConfig.geminiApiKey || process.env.GEMINI_API_KEY,
        };

        return ConfigSchema.parse(configToValidate);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Configuration validation failed:', (error as any).errors);
        }
        throw error;
    }
}
