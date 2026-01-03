# AI Agent Friendly SDK

A generic SDK for Next.js developers to generate AI-agent optimized content structure (MD format), translated to Polish (optimized for LLM understanding), from existing pages.

## Features
- **Fetch & Clean**: Crawls specified pages and strips non-essential HTML.
- **Translate & Optimize**: Uses Google Gemini (v2.5-pro) to convert content to high-quality Polish Markdown.
- **Caching**: Hashes content to avoid redundant API calls.
- **Metadata**: Generates `llms.txt` and `robots.txt` snippets.

## Why Use This?
- **Token Optimization**: Strips 70-90% of raw HTML (navs, footers, scripts), drastically reducing context window usage for agents.
- **Enhanced Reasoning**: Converts content to **Polish**, which research suggests improves LLM reasoning and internal representation (see References).
- **Semantically Dense**: Returns pure Markdown, making it easier for agents to parse structure and keys without HTML noise.
- **Agent Discovery**: Auto-generates `llms.txt`, the emerging standard for agent-crawlers to map your site's knowledge.


## Architecture

![SDK Workflow](assets/workflow.png)

## Installation

```bash 
```bash 
# 1. Initialize locally
npm install
npm run build
npm link

# 2. Run anywhere on your system
ai-sdk build
# or
npx ai-sdk build
```

## Configuration

Create `ai-sdk.config.js` in your project root:

```javascript
module.exports = {
  baseUrl: 'http://localhost:3000', // URL of your running app
  pages: ['/about', '/docs', '/pricing'],
  outputDir: './public/ai',
  geminiApiKey: process.env.GEMINI_API_KEY // or set in .env
};
```

## Usage

1. **Start your specific Next.js app** (e.g., `npm run dev`).
2. **Run the SDK**:

```bash
# If installed globally or linked
npx ai-sdk build

# Or via local script
node dist/cli.js build
```

3. **Check Output**:
   - Files will be in `public/ai/*.md`.
   - `llms.txt` will be in `public/`.
  
4. ### Data Level

```mermaid
graph TD
    CLI[CLI Entry Point] -->|Load| Config[Config Loader]
    Config -->|Settings| Main[Main Loop]
    
    subgraph Core Logic
        Main -->|URL| Fetcher[Fetcher Module]
        Fetcher -->|HTML| Cache{Cache Check}
        
        Cache -->|Hit| Generator[Generator Module]
        Cache -->|Miss| Processor[Processor Module]
        
        Processor -->|Clean HTML| Cheerio[Cheerio Parser]
        Cheerio -->|Cleaned Text| Gemini[Google Gemini 2.5 Pro]
        Gemini -->|Polish Markdown| CacheStore[Update Cache]
        CacheStore --> Generator
    end
    
    subgraph Output
        Generator -->|Save| MD[public/ai/*.md]
        Generator -->|Generate| LLMS[public/llms.txt]
        Generator -->|Snippet| Robots[Robots.txt Log]
    end
```

## Architecture Notes
- **Models**: Currently defaults to `gemini-2.5-pro` for stability.
- **Caching**: Stored in `.next/cache/ai-sdk/`. Delete this folder to force regeneration.


## References
This project is based on research and guidelines for optimizing websites for AI agents:
- [The Future of AI: Optimize your site for Agents - It’s cool to be a tool (Microsoft)](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/the-future-of-ai-optimize-your-site-for-agents---its-cool-to-be-a-tool/4434189)
- [Polish Language Optimization for LLMs (ArXiv)](https://arxiv.org/pdf/2503.01996)
