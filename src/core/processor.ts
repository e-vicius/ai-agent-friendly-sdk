import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class Processor {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string, modelName: string = 'gemini-2.5-pro') {
        this.genAI = new GoogleGenerativeAI(apiKey);

        if (apiKey === 'MOCK') {
            this.model = {
                generateContent: async () => ({
                    response: {
                        text: () => "# TEST TRANSLATION (POLISH)\n\nConverted content from mock."
                    }
                })
            };
        } else {
            console.log(`Using Gemini model: ${modelName}`);
            this.model = this.genAI.getGenerativeModel({ model: modelName });
        }
    }

    cleanHtml(html: string): string {
        const $ = cheerio.load(html);

        // Remove unwanted elements
        $('script, style, nav, footer, svg, iframe, form, noscript, header').remove();

        // Extract text content with some structure preservation
        // This is a naive implementation; a better one would preserve headers as markdown.
        // For now, we rely on the LLM to clean up the semi-structured text or we pass the body HTML directly if it's not too huge.
        // Passing cleaned HTML `$('body').html()` is often better for structure than `.text()`.

        // Let's remove attributes to save tokens
        $('*').each((_, el) => {
            // @ts-ignore
            el.attribs = {};
        });

        const cleanHtml = $('body').html() || '';
        return cleanHtml.trim();
    }

    async processAndTranslate(html: string): Promise<string> {
        const cleaned = this.cleanHtml(html);

        const prompt = `
      You are an expert AI optimization engine and translator.
      
      Task:
      1. Analyze the following HTML content.
      2. Convert it into a clean, structured Markdown format optimized for AI Agents (concise, clear, hierarchical).
      3. CRITICAL: Translate the content into high-quality POLISH language.
      
      The output must be ONLY the Markdown content in Polish. No preambles.
      
      Content:
      ${cleaned}
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error during processing/translation:', error);
            throw error;
        }
    }
}
