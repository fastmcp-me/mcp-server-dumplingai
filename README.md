# Dumpling AI MCP Server 🔍

A Model Context Protocol (MCP) server implementation that connects AI assistants like Claude to Dumpling AI's powerful search and web tools API.

## What is MCP? 🤔

The Model Context Protocol (MCP) is a system that lets AI applications connect to external tools and data sources. It provides a clear and safe way for AI assistants to work with local services and APIs while keeping the user in control.

## Features ✨

This MCP server provides the following tools:

- **get-youtube-transcript**: Fetch transcripts from YouTube videos
- **search**: Perform Google web searches and optionally scrape content from results
- **get-autocomplete**: Get Google search autocomplete suggestions
- **search-maps**: Perform Google Maps searches
- **search-places**: Perform Google Places searches
- **search-news**: Perform Google News searches
- **get-google-reviews**: Fetch Google reviews for a place

## Prerequisites 📋

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) (v18 or higher)
- An [Dumpling AI API key](https://app.dumplingai.com)

## Installation & Usage 🛠️

### Using with npx (No Installation)

You can run the server directly without installation using npx:

```bash
npx -y mcp-server-dumplingai
```

Make sure to set your API key as an environment variable:

```bash
DUMPLING_API_KEY=your-api-key-here npx -y mcp-server-dumplingai
```

### NPM Installation

If you prefer to install globally:

```bash
npm install -g mcp-server-dumplingai
```

Then run it with:

```bash
DUMPLING_API_KEY=your-api-key-here mcp-server-dumplingai
```

### Manual Installation

1. Clone the repository:

```bash
git clone https://github.com/Dumpling-AI/mcp-server-dumplingai.git
cd mcp-server-dumplingai
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Run the server:

```bash
DUMPLING_API_KEY=your-api-key-here node build/index.js
```

## Configuration ⚙️

### Environment Variables

- `DUMPLING_API_KEY`: Your Dumpling AI API key (required)

### Configuring with Claude Desktop

1. Open your Claude Desktop configuration:

```bash
# macOS
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
code %APPDATA%\Claude\claude_desktop_config.json
```

2. Add the Dumpling AI server configuration:

```json
{
  "mcpServers": {
    "dumplingai": {
      "command": "npx",
      "args": ["-y", "mcp-server-dumplingai"],
      "env": {
        "DUMPLING_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

3. Restart Claude Desktop for the changes to take effect.

## Usage 🎯

Once configured, you can ask Claude to use Dumpling AI tools. Here are some example prompts:

```
Can you fetch and summarize the transcript from this YouTube video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

```
Search for recent developments in quantum computing and summarize the key findings.
```

```
What are the most popular places to visit in New York according to Google Maps?
```

## Troubleshooting 🔧

### Common Issues

1. **API Key Issues**

   - Confirm your DUMPLING_API_KEY is valid
   - Check the DUMPLING_API_KEY is correctly set in your configuration
   - Verify there are no spaces or quotes around the API key

2. **Connection Issues**
   - Restart Claude Desktop completely
   - Check Claude Desktop logs

## License

ISC
