#!/usr/bin/env node

/**
 * MCP Server for Dumpling AI
 *
 * Changes:
 * - Added shebang line to make the file executable as a CLI command
 * - Added get-youtube-transcript tool to fetch transcripts from YouTube videos using the Dumpling AI API
 * - Added search tool to perform Google web searches and optionally scrape content from results
 * - Added get-autocomplete tool to get Google search autocomplete suggestions based on a query
 * - Added search-maps tool to perform Google Maps searches
 * - Added search-places tool to perform Google Places searches
 * - Added search-news tool to perform Google News searches
 * - Added get-google-reviews tool to fetch Google reviews for a place
 * - Added scrape tool to extract content from a specific URL
 * - Added crawl tool to recursively crawl and extract content from a website
 * - Added screenshot tool to capture screenshots of web pages
 * - Added extract tool to extract structured data from web pages
 * - Added doc-to-text tool to convert documents to text
 * - Added convert-to-pdf tool to convert various file formats to PDF
 * - Added merge-pdfs tool to combine multiple PDFs into one
 * - Added trim-video tool to trim videos to a specific duration
 * - Added extract-document tool to extract content from a document
 * - Added extract-image tool to extract text and information from images
 * - Added extract-audio tool to extract text from audio files
 * - Added extract-video tool to extract information from videos
 * - Added read-pdf-metadata tool to read metadata from PDF files
 * - Added write-pdf-metadata tool to write metadata to PDF files
 * - Added generate-agent-completion tool to get AI agent completions
 * - Added search-knowledge-base tool to search a knowledge base
 * - Added add-to-knowledge-base tool to add entries to a knowledge base
 * - Added generate-ai-image tool to generate AI images
 * - Added generate-image tool to generate images (alternative API)
 * - Added run-js-code tool to execute JavaScript code
 * - Added run-python-code tool to execute Python code
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const NWS_API_BASE = "https://app.dumplingai.com";

// Define types for Dumpling AI API responses
interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
  position: number;
  sitelinks?: Array<{ title: string; link: string }>;
  date?: string;
  scrapeOutput?: {
    title: string;
    metadata: Record<string, unknown>;
    url: string;
    format: string;
    cleaned: boolean;
    content: string;
  };
}

// Create server instance
const server = new McpServer({
  name: "dumplingai",
  version: "1.0.0",
});

// Tool to fetch YouTube transcript from the Dumpling AI API
server.tool(
  "get-youtube-transcript",
  "Extract transcripts from YouTube videos with optional parameters for timestamps and language preferences. Provides both the transcript text and detected language.",
  {
    videoUrl: z
      .string()
      .url()
      .describe("URL of the YouTube video to extract the transcript from"),
    includeTimestamps: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to include timestamps in the transcript output"),
    timestampsToCombine: z
      .number()
      .optional()
      .default(1)
      .describe(
        "Number of transcript chunks to combine into a single timestamp"
      ),
    preferredLanguage: z
      .string()
      .optional()
      .default("en")
      .describe(
        "Preferred language code for the transcript (e.g., 'en', 'es', 'fr')"
      ),
  },
  async ({
    videoUrl,
    includeTimestamps,
    timestampsToCombine,
    preferredLanguage,
  }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(
        `${NWS_API_BASE}/api/v1/get-youtube-transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            videoUrl,
            includeTimestamps,
            timestampsToCombine,
            preferredLanguage,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch YouTube transcript: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: `Transcript: ${data.transcript}\nLanguage: ${data.language}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching YouTube transcript:", error);
      throw error;
    }
  }
);

// Tool to perform Google web search and optionally scrape content from results
server.tool(
  "search",
  "Perform Google web searches with customizable parameters. Can optionally scrape and extract content from search results to provide more detailed information beyond snippets.",
  {
    query: z.string().describe("Search query to perform on Google"),
    country: z
      .string()
      .optional()
      .describe("Country code for localized search results (e.g., 'us', 'uk')"),
    location: z
      .string()
      .optional()
      .describe("Location name to target search results to a specific area"),
    language: z
      .string()
      .optional()
      .describe("Language code for search results (e.g., 'en', 'es')"),
    dateRange: z
      .enum([
        "anyTime",
        "pastHour",
        "pastDay",
        "pastWeek",
        "pastMonth",
        "pastYear",
      ])
      .optional()
      .describe("Time range filter for search results"),
    page: z.number().optional().describe("Page number for paginated results"),
    scrapeResults: z
      .boolean()
      .optional()
      .describe("Whether to extract content from search result pages"),
    numResultsToScrape: z
      .number()
      .optional()
      .describe("Number of search results to scrape content from"),
    scrapeOptions: z
      .object({
        format: z.enum(["markdown", "html", "screenshot"]).optional(),
        cleaned: z.boolean().optional(),
      })
      .optional()
      .describe("Options for scraping content from search results"),
  },
  async ({
    query,
    country,
    location,
    language,
    dateRange,
    page,
    scrapeResults,
    numResultsToScrape,
    scrapeOptions,
  }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          country,
          location,
          language,
          dateRange,
          page,
          scrapeResults,
          numResultsToScrape,
          scrapeOptions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to perform search: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      // Transform search results into a structured format for the MCP response
      const formattedResults = {
        searchParameters: data.searchParameters,
        organicResults: data.organic.map((result: SearchResultItem) => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet,
          position: result.position,
          ...(result.scrapeOutput && { content: result.scrapeOutput.content }),
        })),
        ...(data.featuredSnippet && { featuredSnippet: data.featuredSnippet }),
        ...(data.relatedSearches && { relatedSearches: data.relatedSearches }),
        ...(data.peopleAlsoAsk && { peopleAlsoAsk: data.peopleAlsoAsk }),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedResults, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error performing search:", error);
      throw error;
    }
  }
);

// Tool to get Google search autocomplete suggestions
server.tool(
  "get-autocomplete",
  "Retrieve Google search autocomplete suggestions for a given query. Helps to discover related search terms and common queries related to a topic.",
  {
    query: z
      .string()
      .describe("Search query to get autocomplete suggestions for"),
    location: z
      .string()
      .optional()
      .describe("Location name to target suggestions to a specific area"),
    country: z
      .string()
      .optional()
      .describe("Country code for localized suggestions (e.g., 'us', 'uk')"),
    language: z
      .string()
      .optional()
      .describe("Language code for suggestions (e.g., 'en', 'es')"),
  },
  async ({ query, location, country, language }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/get-autocomplete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          location,
          country,
          language,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get autocomplete suggestions: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                searchParameters: data.searchParameters,
                suggestions: data.suggestions,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error getting autocomplete suggestions:", error);
      throw error;
    }
  }
);

// Tool to perform Google Maps search
server.tool(
  "search-maps",
  "Search Google Maps for locations, businesses, and points of interest. Returns geographic coordinates and place details for map-based queries.",
  {
    query: z.string().describe("Search query for Google Maps locations"),
    gpsPositionZoom: z
      .string()
      .optional()
      .describe(
        "GPS coordinates with zoom level in format 'latitude,longitude,zoom'"
      ),
    placeId: z
      .string()
      .optional()
      .describe("Specific Google Place ID to retrieve details for"),
    cid: z
      .string()
      .optional()
      .describe("Google Maps CID (Content ID) for specific places"),
    language: z
      .string()
      .optional()
      .describe("Language code for results (e.g., 'en', 'es')"),
    page: z.number().optional().describe("Page number for paginated results"),
  },
  async ({ query, gpsPositionZoom, placeId, cid, language, page }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/search-maps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          gpsPositionZoom,
          placeId,
          cid,
          language,
          page,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to perform maps search: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                searchParameters: data.searchParameters,
                ll: data.ll,
                places: data.places,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error performing maps search:", error);
      throw error;
    }
  }
);

// Tool to perform Google Places search
server.tool(
  "search-places",
  "Search for places with detailed business information. Includes more specific data than maps search such as business details, ratings, and categories.",
  {
    query: z.string().describe("Search query for Google Places"),
    country: z
      .string()
      .optional()
      .describe("Country code for localized results (e.g., 'us', 'uk')"),
    location: z
      .string()
      .optional()
      .describe("Location name to target search results to a specific area"),
    language: z
      .string()
      .optional()
      .describe("Language code for results (e.g., 'en', 'es')"),
    page: z.number().optional().describe("Page number for paginated results"),
  },
  async ({ query, country, location, language, page }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/search-places`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          country,
          location,
          language,
          page,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to perform places search: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                searchParameters: data.searchParameters,
                places: data.places,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error performing places search:", error);
      throw error;
    }
  }
);

// Tool to perform Google News search
server.tool(
  "search-news",
  "Search for news articles across multiple sources with customizable date ranges. Useful for finding recent information, current events, and news coverage on specific topics.",
  {
    query: z.string().describe("Search query for news articles"),
    country: z
      .string()
      .optional()
      .describe("Country code for localized news results (e.g., 'us', 'uk')"),
    location: z
      .string()
      .optional()
      .describe("Location name to target news to a specific area"),
    language: z
      .string()
      .optional()
      .describe("Language code for news results (e.g., 'en', 'es')"),
    dateRange: z
      .enum([
        "anyTime",
        "pastHour",
        "pastDay",
        "pastWeek",
        "pastMonth",
        "pastYear",
      ])
      .optional()
      .describe("Time range filter for news results"),
    page: z.number().optional().describe("Page number for paginated results"),
  },
  async ({ query, country, location, language, dateRange, page }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/search-news`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          country,
          location,
          language,
          dateRange,
          page,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to perform news search: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                searchParameters: data.searchParameters,
                news: data.news,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error performing news search:", error);
      throw error;
    }
  }
);

// Tool to fetch Google reviews for a place
server.tool(
  "get-google-reviews",
  "Retrieve Google reviews for businesses or places. Fetches rating data, review content, and reviewer information to provide insights on public opinion about a location.",
  {
    placeId: z
      .string()
      .optional()
      .describe("Google Place ID to retrieve reviews for"),
    businessName: z
      .string()
      .optional()
      .describe("Name of the business to search for reviews"),
    location: z
      .string()
      .optional()
      .describe("Location to help narrow down business search"),
    language: z
      .string()
      .optional()
      .describe("Language code for review content (e.g., 'en', 'es')"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of reviews to retrieve"),
    sortBy: z
      .enum(["relevance", "newest"])
      .optional()
      .describe("Sorting method for reviews"),
  },
  async ({ placeId, businessName, location, language, limit, sortBy }) => {
    // Ensure either placeId or businessName is provided
    if (!placeId && !businessName) {
      throw new Error("Either placeId or businessName is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(
        `${NWS_API_BASE}/api/v1/get-google-reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            placeId,
            businessName,
            location,
            language,
            limit,
            sortBy,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get Google reviews: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error getting Google reviews:", error);
      throw error;
    }
  }
);

// Tool to scrape content from a URL
server.tool(
  "scrape",
  "Extract and parse content from any web page. Can return content in various formats including markdown and HTML, with options to clean and process the data.",
  {
    url: z.string().url().describe("URL of the web page to scrape"),
    format: z
      .enum(["markdown", "html", "screenshot"])
      .optional()
      .describe("Output format for the scraped content"),
    cleaned: z
      .boolean()
      .optional()
      .describe("Whether to clean and simplify the content structure"),
    renderJs: z
      .boolean()
      .optional()
      .describe("Whether to execute JavaScript on the page before scraping"),
  },
  async ({ url, format, cleaned, renderJs }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          format,
          cleaned,
          renderJs,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to scrape URL: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                title: data.title,
                metadata: data.metadata,
                url: data.url,
                format: data.format,
                cleaned: data.cleaned,
                content: data.content,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error scraping URL:", error);
      throw error;
    }
  }
);

// Tool to crawl a website and extract content
server.tool(
  "crawl",
  "Recursively crawl websites and extract content from multiple pages. Supports depth control, filtering, and various content extraction options for comprehensive site analysis.",
  {
    baseUrl: z.string().url().describe("Starting URL for the crawl operation"),
    maxPages: z
      .number()
      .optional()
      .describe("Maximum number of pages to crawl"),
    crawlBeyondBaseUrl: z
      .boolean()
      .optional()
      .describe("Whether to follow links to external domains"),
    depth: z
      .number()
      .optional()
      .describe("Maximum depth of pages to crawl from the base URL"),
    strategy: z
      .string()
      .optional()
      .describe("Crawling strategy (e.g., 'breadth-first', 'depth-first')"),
    filterRegex: z
      .string()
      .optional()
      .describe("Regular expression pattern to filter URLs"),
    scrapeOptions: z
      .object({
        format: z.enum(["markdown", "html", "screenshot"]).optional(),
        cleaned: z.boolean().optional(),
        renderJs: z.boolean().optional(),
      })
      .optional()
      .describe("Options for scraping content from crawled pages"),
  },
  async ({
    baseUrl,
    maxPages,
    crawlBeyondBaseUrl,
    depth,
    strategy,
    filterRegex,
    scrapeOptions,
  }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/crawl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          baseUrl,
          maxPages,
          crawlBeyondBaseUrl,
          depth,
          strategy,
          filterRegex,
          scrapeOptions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to crawl website: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error crawling website:", error);
      throw error;
    }
  }
);

// Tool to capture a screenshot of a webpage
server.tool(
  "screenshot",
  "Capture screenshots of web pages with customizable viewport settings. Supports various formats, quality settings, and options for full-page captures.",
  {
    url: z.string().url().describe("URL of the web page to capture"),
    width: z.number().optional().describe("Viewport width in pixels"),
    height: z.number().optional().describe("Viewport height in pixels"),
    deviceScaleFactor: z
      .number()
      .optional()
      .describe("Device scale factor for high-DPI screenshots"),
    fullPage: z
      .boolean()
      .optional()
      .describe("Whether to capture the full scrollable page"),
    format: z
      .enum(["png", "jpeg"])
      .optional()
      .describe("Image format for the screenshot"),
    quality: z
      .number()
      .optional()
      .describe("Image quality for JPEG format (1-100)"),
    renderJs: z
      .boolean()
      .optional()
      .describe("Whether to execute JavaScript on the page before capturing"),
    waitFor: z
      .number()
      .optional()
      .describe("Time in milliseconds to wait before capturing the screenshot"),
  },
  async ({
    url,
    width,
    height,
    deviceScaleFactor,
    fullPage,
    format,
    quality,
    renderJs,
    waitFor,
  }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/screenshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          width,
          height,
          deviceScaleFactor,
          fullPage,
          format,
          quality,
          renderJs,
          waitFor,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to capture screenshot: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                url: data.url,
                imageBase64: data.imageBase64.substring(0, 100) + "...", // Show truncated base64 image data
                format: data.format,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      throw error;
    }
  }
);

// Tool to extract structured data from a webpage
server.tool(
  "extract",
  "Extract structured data from web pages using AI-powered instructions. Converts unstructured web content into structured data with customizable schemas.",
  {
    url: z.string().url().describe("URL of the web page to extract data from"),
    instructions: z
      .string()
      .describe("Natural language instructions for what data to extract"),
    schema: z
      .record(z.any())
      .optional()
      .describe(
        "Optional JSON schema to define the structure of extracted data"
      ),
    renderJs: z
      .boolean()
      .optional()
      .describe("Whether to execute JavaScript on the page before extracting"),
  },
  async ({ url, instructions, schema, renderJs }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          instructions,
          schema,
          renderJs,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to extract data: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error extracting data:", error);
      throw error;
    }
  }
);

// Tool to convert documents to text
server.tool(
  "doc-to-text",
  "Convert various document formats to plain text with optional OCR for images and scanned documents. Extracts raw text content while preserving basic structure.",
  {
    url: z
      .string()
      .url()
      .optional()
      .describe("URL of the document to convert to text"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded document data as an alternative to URL"),
    options: z
      .object({
        ocr: z
          .boolean()
          .optional()
          .describe("Whether to use OCR for images and scanned documents"),
        language: z
          .string()
          .optional()
          .describe("Preferred language code for OCR processing"),
      })
      .optional()
      .describe("Additional options for text extraction"),
  },
  async ({ url, base64, options }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/doc-to-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          base64,
          options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to convert document to text: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                text: data.text,
                pages: data.pages,
                metadata: data.metadata,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error converting document to text:", error);
      throw error;
    }
  }
);

// Tool to convert various file formats to PDF
server.tool(
  "convert-to-pdf",
  "Convert various file formats to PDF including documents, slides, spreadsheets, and images. Preserves formatting and layout of the original files.",
  {
    url: z
      .string()
      .url()
      .optional()
      .describe("URL of the file to convert to PDF"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded file data as an alternative to URL"),
    format: z
      .enum([
        "docx",
        "doc",
        "ppt",
        "pptx",
        "xls",
        "xlsx",
        "txt",
        "html",
        "image",
      ])
      .optional()
      .describe("Original file format to help with the conversion process"),
    options: z
      .object({
        margin: z.number().optional().describe("Margin size in pixels"),
        pageSize: z
          .string()
          .optional()
          .describe("Page size (e.g., 'A4', 'Letter')"),
        quality: z
          .number()
          .optional()
          .describe("Output quality for the PDF (1-100)"),
      })
      .optional()
      .describe("Additional options for PDF conversion"),
  },
  async ({ url, base64, format, options }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/convert-to-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          base64,
          format,
          options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to convert to PDF: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                pdfBase64: data.pdfBase64
                  ? data.pdfBase64.substring(0, 100) + "..."
                  : null,
                metadata: data.metadata,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error converting to PDF:", error);
      throw error;
    }
  }
);

// Tool to combine multiple PDFs into one
server.tool(
  "merge-pdfs",
  "Combine multiple PDF files into a single document with optional page numbering and table of contents. Maintains quality and structure of original files.",
  {
    urls: z
      .array(z.string())
      .optional()
      .describe("Array of URLs pointing to PDF files to merge"),
    base64Files: z
      .array(z.string())
      .optional()
      .describe("Array of base64-encoded PDF files to merge"),
    options: z
      .object({
        addPageNumbers: z
          .boolean()
          .optional()
          .describe("Whether to add page numbers to the merged PDF"),
        addTableOfContents: z
          .boolean()
          .optional()
          .describe("Whether to add a table of contents to the merged PDF"),
      })
      .optional()
      .describe("Additional options for the PDF merging process"),
  },
  async ({ urls, base64Files, options }) => {
    // Ensure either urls or base64Files is provided
    if (
      (!urls || urls.length === 0) &&
      (!base64Files || base64Files.length === 0)
    ) {
      throw new Error("Either urls or base64Files is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/merge-pdfs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          urls,
          base64Files,
          options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to merge PDFs: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                mergedPdfBase64: data.mergedPdfBase64
                  ? data.mergedPdfBase64.substring(0, 100) + "..."
                  : null,
                pageCount: data.pageCount,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error merging PDFs:", error);
      throw error;
    }
  }
);

// Tool to trim videos to a specific duration
server.tool(
  "trim-video",
  "Trim videos to specific start and end times with customizable output formats. Supports conversion to MP4, WebM, or GIF with quality control options.",
  {
    url: z.string().url().optional().describe("URL of the video to trim"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded video data as an alternative to URL"),
    startTime: z
      .number()
      .describe("Start time in seconds for the trimmed video"),
    endTime: z.number().describe("End time in seconds for the trimmed video"),
    output: z
      .enum(["mp4", "webm", "gif"])
      .optional()
      .describe("Output format for the trimmed video"),
    options: z
      .object({
        width: z
          .number()
          .optional()
          .describe("Width of the output video in pixels"),
        height: z
          .number()
          .optional()
          .describe("Height of the output video in pixels"),
        fps: z
          .number()
          .optional()
          .describe("Frames per second for the output video"),
        quality: z
          .number()
          .optional()
          .describe("Quality setting for the output video (1-100)"),
      })
      .optional()
      .describe("Additional options for video processing"),
  },
  async ({ url, base64, startTime, endTime, output, options }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/trim-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          base64,
          startTime,
          endTime,
          output,
          options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to trim video: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                outputBase64: data.outputBase64
                  ? data.outputBase64.substring(0, 100) + "..."
                  : null,
                format: data.format,
                duration: data.duration,
                size: data.size,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error trimming video:", error);
      throw error;
    }
  }
);

// Tool to extract content from a document
server.tool(
  "extract-document",
  "Extract specific content types from documents including text, tables, forms, and structured data. Supports OCR for images and scanned documents.",
  {
    url: z
      .string()
      .url()
      .optional()
      .describe("URL of the document to extract content from"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded document data as an alternative to URL"),
    format: z
      .enum(["text", "structured", "tables", "forms"])
      .describe("Type of content to extract from the document"),
    options: z
      .object({
        ocr: z
          .boolean()
          .optional()
          .describe("Whether to use OCR for images and scanned documents"),
        language: z
          .string()
          .optional()
          .describe("Preferred language code for OCR processing"),
        includeMetadata: z
          .boolean()
          .optional()
          .describe(
            "Whether to include document metadata in the extraction results"
          ),
      })
      .optional()
      .describe("Additional options for document extraction"),
  },
  async ({ url, base64, format, options }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/extract-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          base64,
          format,
          options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to extract document content: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error extracting document content:", error);
      throw error;
    }
  }
);

// Tool to extract text and information from images
server.tool(
  "extract-image",
  "Extract text, objects, faces, or color information from images using AI-powered analysis. Provides comprehensive visual content understanding.",
  {
    url: z.string().url().optional().describe("URL of the image to analyze"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded image data as an alternative to URL"),
    extractionType: z
      .enum(["text", "objects", "faces", "colors", "all"])
      .describe("Type of information to extract from the image"),
    options: z
      .object({
        confidence: z
          .number()
          .optional()
          .describe("Minimum confidence threshold for detected elements (0-1)"),
        language: z
          .string()
          .optional()
          .describe("Language code for OCR text extraction"),
        detectOrientation: z
          .boolean()
          .optional()
          .describe(
            "Whether to automatically detect and correct image orientation"
          ),
      })
      .optional()
      .describe("Additional options for image analysis"),
  },
  async ({ url, base64, extractionType, options }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/extract-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          base64,
          extractionType,
          options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to extract image content: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error extracting image content:", error);
      throw error;
    }
  }
);

// Tool to extract text from audio files
server.tool(
  "extract-audio",
  "Convert speech in audio files to text with optional speaker diarization and word-level timestamps. Supports multiple languages and profanity filtering.",
  {
    url: z
      .string()
      .url()
      .optional()
      .describe("URL of the audio file to transcribe"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded audio data as an alternative to URL"),
    language: z
      .string()
      .optional()
      .describe("Language code for the audio content (e.g., 'en-US')"),
    options: z
      .object({
        model: z
          .enum(["standard", "enhanced"])
          .optional()
          .describe(
            "Speech recognition model to use (standard or enhanced quality)"
          ),
        speakerDiarization: z
          .boolean()
          .optional()
          .describe("Whether to identify and label different speakers"),
        wordTimestamps: z
          .boolean()
          .optional()
          .describe("Whether to include timestamps for each word"),
        filterProfanity: z
          .boolean()
          .optional()
          .describe("Whether to filter out profanity from the transcript"),
      })
      .optional()
      .describe("Additional options for audio transcription"),
  },
  async ({ url, base64, language, options }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/extract-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          base64,
          language,
          options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to extract audio content: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                transcript: data.transcript,
                language: data.language,
                durationInSeconds: data.durationInSeconds,
                ...(data.segments && { segments: data.segments }),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error extracting audio content:", error);
      throw error;
    }
  }
);

// Tool to extract information from videos
server.tool(
  "extract-video",
  "Extract transcripts, scenes, objects, and summaries from video content. Performs multi-modal analysis for comprehensive video understanding.",
  {
    url: z.string().url().optional().describe("URL of the video to analyze"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded video data as an alternative to URL"),
    extractionType: z
      .enum(["transcript", "scenes", "objects", "summary", "all"])
      .describe("Type of information to extract from the video"),
    options: z
      .object({
        language: z
          .string()
          .optional()
          .describe("Language code for transcript extraction"),
        timestampInterval: z
          .number()
          .optional()
          .describe("Interval in seconds for timestamp markers"),
        confidence: z
          .number()
          .optional()
          .describe("Minimum confidence threshold for object detection"),
        speakerDiarization: z
          .boolean()
          .optional()
          .describe(
            "Whether to identify and label different speakers in transcripts"
          ),
      })
      .optional()
      .describe("Additional options for video analysis"),
  },
  async ({ url, base64, extractionType, options }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/extract-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          base64,
          extractionType,
          options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to extract video content: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error extracting video content:", error);
      throw error;
    }
  }
);

// Tool to read metadata from PDF files
server.tool(
  "read-pdf-metadata",
  "Extract metadata from PDF files including title, author, creation date, and other document properties. Provides insights into document origin and characteristics.",
  {
    url: z
      .string()
      .url()
      .optional()
      .describe("URL of the PDF file to read metadata from"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded PDF data as an alternative to URL"),
    includeExtended: z
      .boolean()
      .optional()
      .describe(
        "Whether to include extended metadata properties in the results"
      ),
  },
  async ({ url, base64, includeExtended }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/read-pdf-metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          base64,
          includeExtended,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to read PDF metadata: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error reading PDF metadata:", error);
      throw error;
    }
  }
);

// Tool to write metadata to PDF files
server.tool(
  "write-pdf-metadata",
  "Update metadata in PDF files with custom properties including title, author, keywords, and other document attributes. Preserves document content while modifying metadata.",
  {
    url: z
      .string()
      .url()
      .optional()
      .describe("URL of the PDF file to update metadata for"),
    base64: z
      .string()
      .optional()
      .describe("Base64-encoded PDF data as an alternative to URL"),
    metadata: z
      .object({
        title: z.string().optional().describe("Title of the document"),
        author: z.string().optional().describe("Author of the document"),
        subject: z
          .string()
          .optional()
          .describe("Subject or description of the document"),
        keywords: z
          .array(z.string())
          .optional()
          .describe("Keywords related to the document content"),
        creator: z
          .string()
          .optional()
          .describe("Application used to create the original document"),
        producer: z
          .string()
          .optional()
          .describe("Application used to convert the document to PDF"),
        creationDate: z
          .string()
          .optional()
          .describe("Date when the document was created (ISO format)"),
        modDate: z
          .string()
          .optional()
          .describe("Date when the document was last modified (ISO format)"),
        customProperties: z
          .record(z.string())
          .optional()
          .describe("Custom metadata properties as key-value pairs"),
      })
      .describe("Metadata properties to write to the PDF file"),
  },
  async ({ url, base64, metadata }) => {
    // Ensure either url or base64 is provided
    if (!url && !base64) {
      throw new Error("Either url or base64 is required");
    }

    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(
        `${NWS_API_BASE}/api/v1/write-pdf-metadata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            url,
            base64,
            metadata,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to write PDF metadata: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                outputBase64: data.outputBase64
                  ? data.outputBase64.substring(0, 100) + "..."
                  : null,
                success: data.success,
                updatedMetadata: data.updatedMetadata,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error writing PDF metadata:", error);
      throw error;
    }
  }
);

// Tool to get AI agent completions
server.tool(
  "generate-agent-completion",
  "Generate AI text completions with customizable models, parameters, and context. Supports function calling capabilities with defined tools for complex task execution.",
  {
    prompt: z.string().describe("Text prompt for generating the completion"),
    agentId: z
      .string()
      .optional()
      .describe("Specific agent ID to use for the completion"),
    model: z.string().optional().describe("AI model to use for the completion"),
    temperature: z
      .number()
      .optional()
      .describe(
        "Temperature setting for controlling response randomness (0-1)"
      ),
    maxTokens: z
      .number()
      .optional()
      .describe("Maximum number of tokens to generate in the response"),
    tools: z
      .array(
        z.object({
          name: z.string().describe("Name of the tool"),
          description: z.string().describe("Description of what the tool does"),
          parameters: z
            .record(z.any())
            .describe("Parameters accepted by the tool"),
        })
      )
      .optional()
      .describe("Function calling tools to make available to the AI"),
    context: z
      .array(z.string())
      .optional()
      .describe("Additional context strings to inform the completion"),
  },
  async ({
    prompt,
    agentId,
    model,
    temperature,
    maxTokens,
    tools,
    context,
  }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(
        `${NWS_API_BASE}/api/v1/generate-agent-completion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            prompt,
            agentId,
            model,
            temperature,
            maxTokens,
            tools,
            context,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to generate agent completion: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                completion: data.completion,
                toolCalls: data.toolCalls,
                tokenUsage: data.tokenUsage,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error generating agent completion:", error);
      throw error;
    }
  }
);

// Tool to search a knowledge base
server.tool(
  "search-knowledge-base",
  "Search through structured knowledge bases for relevant information with semantic matching. Retrieves context-aware results based on similarity and metadata filters.",
  {
    kbId: z.string().describe("ID of the knowledge base to search"),
    query: z
      .string()
      .describe("Search query to match against knowledge base content"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of results to return"),
    metadata: z
      .record(z.any())
      .optional()
      .describe("Metadata filters to apply to the search"),
    similarityThreshold: z
      .number()
      .optional()
      .describe("Minimum similarity score threshold for results (0-1)"),
  },
  async ({ kbId, query, limit, metadata, similarityThreshold }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(
        `${NWS_API_BASE}/api/v1/search-knowledge-base`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            kbId,
            query,
            limit,
            metadata,
            similarityThreshold,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to search knowledge base: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      throw error;
    }
  }
);

// Tool to add entries to a knowledge base
server.tool(
  "add-to-knowledge-base",
  "Add new entries to knowledge bases with optional metadata tagging. Supports upsert operations for updating existing entries or adding new content.",
  {
    kbId: z.string().describe("ID of the knowledge base to add entries to"),
    entries: z
      .array(
        z.object({
          text: z.string().describe("Text content of the knowledge base entry"),
          metadata: z
            .record(z.any())
            .optional()
            .describe("Optional metadata for the entry"),
        })
      )
      .describe("Array of entries to add to the knowledge base"),
    upsert: z
      .boolean()
      .optional()
      .describe("Whether to update existing entries with matching IDs"),
  },
  async ({ kbId, entries, upsert }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(
        `${NWS_API_BASE}/api/v1/add-to-knowledge-base`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            kbId,
            entries,
            upsert,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to add to knowledge base: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error adding to knowledge base:", error);
      throw error;
    }
  }
);

// Tool to generate AI images
server.tool(
  "generate-ai-image",
  "Generate AI images from text prompts with customizable dimensions, quality, and style settings. Creates original images based on detailed text descriptions.",
  {
    prompt: z.string().describe("Text description of the image to generate"),
    model: z
      .string()
      .optional()
      .describe("AI model to use for image generation"),
    width: z
      .number()
      .optional()
      .describe("Width of the generated image in pixels"),
    height: z
      .number()
      .optional()
      .describe("Height of the generated image in pixels"),
    numImages: z.number().optional().describe("Number of images to generate"),
    quality: z
      .enum(["standard", "hd"])
      .optional()
      .describe("Quality level of the generated images"),
    style: z
      .string()
      .optional()
      .describe("Style parameter to influence the image aesthetics"),
    negativePrompt: z
      .string()
      .optional()
      .describe("Text description of elements to avoid in the image"),
  },
  async ({
    prompt,
    model,
    width,
    height,
    numImages,
    quality,
    style,
    negativePrompt,
  }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/generate-ai-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          model,
          width,
          height,
          numImages,
          quality,
          style,
          negativePrompt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to generate AI image: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      // Create a readable response with truncated image data
      const formattedImages = data.images.map((img: string, idx: number) => {
        return {
          imageIndex: idx,
          imageBase64: img.substring(0, 100) + "...",
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                images: formattedImages,
                model: data.model,
                prompt: data.prompt,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error generating AI image:", error);
      throw error;
    }
  }
);

// Tool to generate images (alternative API)
server.tool(
  "generate-image",
  "Generate images using various AI providers including DALL-E, Stable Diffusion, and Midjourney. Offers multiple provider options with consistent parameter interface.",
  {
    prompt: z.string().describe("Text description of the image to generate"),
    provider: z
      .enum(["dalle", "stable-diffusion", "midjourney"])
      .optional()
      .describe("AI provider to use for image generation"),
    width: z
      .number()
      .optional()
      .describe("Width of the generated image in pixels"),
    height: z
      .number()
      .optional()
      .describe("Height of the generated image in pixels"),
    numImages: z.number().optional().describe("Number of images to generate"),
    quality: z
      .enum(["standard", "hd"])
      .optional()
      .describe("Quality level of the generated images"),
    style: z
      .string()
      .optional()
      .describe("Style parameter to influence the image aesthetics"),
    negativePrompt: z
      .string()
      .optional()
      .describe("Text description of elements to avoid in the image"),
  },
  async ({
    prompt,
    provider,
    width,
    height,
    numImages,
    quality,
    style,
    negativePrompt,
  }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          provider,
          width,
          height,
          numImages,
          quality,
          style,
          negativePrompt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to generate image: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      // Create a readable response with truncated image data
      const formattedImages = data.images.map((img: string, idx: number) => {
        return {
          imageIndex: idx,
          imageBase64: img.substring(0, 100) + "...",
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                images: formattedImages,
                provider: data.provider,
                prompt: data.prompt,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }
);

// Tool to execute JavaScript code
server.tool(
  "run-js-code",
  "Execute JavaScript code in a secure sandbox environment with optional NPM dependencies. Returns execution results, console output, and execution metrics.",
  {
    code: z.string().describe("JavaScript code to execute"),
    dependencies: z
      .record(z.string())
      .optional()
      .describe("NPM dependencies as object with name-version pairs"),
    timeout: z
      .number()
      .optional()
      .describe("Maximum execution time in milliseconds"),
    memory: z.number().optional().describe("Maximum memory allocation in MB"),
  },
  async ({ code, dependencies, timeout, memory }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/run-js-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          code,
          dependencies,
          timeout,
          memory,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to run JavaScript code: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                result: data.result,
                console: data.console,
                executionTime: data.executionTime,
                error: data.error,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error running JavaScript code:", error);
      throw error;
    }
  }
);

// Tool to execute Python code
server.tool(
  "run-python-code",
  "Execute Python code in a secure sandbox environment with optional package dependencies. Supports standard libraries and popular data science packages.",
  {
    code: z.string().describe("Python code to execute"),
    dependencies: z
      .array(z.string())
      .optional()
      .describe("Python package dependencies as array of package names"),
    timeout: z
      .number()
      .optional()
      .describe("Maximum execution time in milliseconds"),
    memory: z.number().optional().describe("Maximum memory allocation in MB"),
    saveOutputFiles: z
      .boolean()
      .optional()
      .describe("Whether to save and return files generated during execution"),
  },
  async ({ code, dependencies, timeout, memory, saveOutputFiles }) => {
    // Get API key from environment variable
    const apiKey = process.env.DUMPLING_API_KEY;
    if (!apiKey) {
      throw new Error("DUMPLING_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${NWS_API_BASE}/api/v1/run-python-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          code,
          dependencies,
          timeout,
          memory,
          saveOutputFiles,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to run Python code: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                result: data.result,
                stdout: data.stdout,
                stderr: data.stderr,
                executionTime: data.executionTime,
                outputFiles: data.outputFiles,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Error running Python code:", error);
      throw error;
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Dumpling AI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
