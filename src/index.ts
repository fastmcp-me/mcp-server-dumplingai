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
  {
    videoUrl: z.string().url(),
    includeTimestamps: z.boolean().optional(),
    timestampsToCombine: z.number().optional(),
    preferredLanguage: z.string().optional(),
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
  {
    query: z.string(),
    country: z.string().optional(),
    location: z.string().optional(),
    language: z.string().optional(),
    dateRange: z
      .enum([
        "anyTime",
        "pastHour",
        "pastDay",
        "pastWeek",
        "pastMonth",
        "pastYear",
      ])
      .optional(),
    page: z.number().optional(),
    scrapeResults: z.boolean().optional(),
    numResultsToScrape: z.number().optional(),
    scrapeOptions: z
      .object({
        format: z.enum(["markdown", "html", "screenshot"]).optional(),
        cleaned: z.boolean().optional(),
      })
      .optional(),
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
  {
    query: z.string(),
    location: z.string().optional(),
    country: z.string().optional(),
    language: z.string().optional(),
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
  {
    query: z.string(),
    gpsPositionZoom: z.string().optional(),
    placeId: z.string().optional(),
    cid: z.string().optional(),
    language: z.string().optional(),
    page: z.number().optional(),
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
  {
    query: z.string(),
    country: z.string().optional(),
    location: z.string().optional(),
    language: z.string().optional(),
    page: z.number().optional(),
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
  {
    query: z.string(),
    country: z.string().optional(),
    location: z.string().optional(),
    language: z.string().optional(),
    dateRange: z
      .enum([
        "anyTime",
        "pastHour",
        "pastDay",
        "pastWeek",
        "pastMonth",
        "pastYear",
      ])
      .optional(),
    page: z.number().optional(),
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
  {
    placeId: z.string().optional(),
    businessName: z.string().optional(),
    location: z.string().optional(),
    language: z.string().optional(),
    limit: z.number().optional(),
    sortBy: z.enum(["relevance", "newest"]).optional(),
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
  {
    url: z.string().url(),
    format: z.enum(["markdown", "html", "screenshot"]).optional(),
    cleaned: z.boolean().optional(),
    renderJs: z.boolean().optional(),
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
  {
    baseUrl: z.string().url(),
    maxPages: z.number().optional(),
    crawlBeyondBaseUrl: z.boolean().optional(),
    depth: z.number().optional(),
    strategy: z.string().optional(),
    filterRegex: z.string().optional(),
    scrapeOptions: z
      .object({
        format: z.enum(["markdown", "html", "screenshot"]).optional(),
        cleaned: z.boolean().optional(),
        renderJs: z.boolean().optional(),
      })
      .optional(),
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
  {
    url: z.string().url(),
    width: z.number().optional(),
    height: z.number().optional(),
    deviceScaleFactor: z.number().optional(),
    fullPage: z.boolean().optional(),
    format: z.enum(["png", "jpeg"]).optional(),
    quality: z.number().optional(),
    renderJs: z.boolean().optional(),
    waitFor: z.number().optional(),
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
  {
    url: z.string().url(),
    instructions: z.string(),
    schema: z.record(z.any()).optional(),
    renderJs: z.boolean().optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
    options: z
      .object({
        ocr: z.boolean().optional(),
        language: z.string().optional(),
      })
      .optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
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
      .optional(),
    options: z
      .object({
        quality: z.number().optional(),
        pageSize: z.string().optional(),
        margin: z.number().optional(),
      })
      .optional(),
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
  {
    urls: z.array(z.string().url()).optional(),
    base64Files: z.array(z.string()).optional(),
    options: z
      .object({
        addPageNumbers: z.boolean().optional(),
        addTableOfContents: z.boolean().optional(),
      })
      .optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
    startTime: z.number(),
    endTime: z.number(),
    output: z.enum(["mp4", "webm", "gif"]).optional(),
    options: z
      .object({
        quality: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        fps: z.number().optional(),
      })
      .optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
    format: z.enum(["text", "structured", "tables", "forms"]),
    options: z
      .object({
        ocr: z.boolean().optional(),
        language: z.string().optional(),
        includeMetadata: z.boolean().optional(),
      })
      .optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
    extractionType: z.enum(["text", "objects", "faces", "colors", "all"]),
    options: z
      .object({
        language: z.string().optional(),
        confidence: z.number().optional(),
        detectOrientation: z.boolean().optional(),
      })
      .optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
    language: z.string().optional(),
    options: z
      .object({
        model: z.enum(["standard", "enhanced"]).optional(),
        speakerDiarization: z.boolean().optional(),
        wordTimestamps: z.boolean().optional(),
        filterProfanity: z.boolean().optional(),
      })
      .optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
    extractionType: z.enum([
      "transcript",
      "scenes",
      "objects",
      "summary",
      "all",
    ]),
    options: z
      .object({
        language: z.string().optional(),
        timestampInterval: z.number().optional(),
        confidence: z.number().optional(),
        speakerDiarization: z.boolean().optional(),
      })
      .optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
    includeExtended: z.boolean().optional(),
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
  {
    url: z.string().url().optional(),
    base64: z.string().optional(),
    metadata: z.object({
      title: z.string().optional(),
      author: z.string().optional(),
      subject: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      creator: z.string().optional(),
      producer: z.string().optional(),
      creationDate: z.string().optional(),
      modDate: z.string().optional(),
      customProperties: z.record(z.string()).optional(),
    }),
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
  {
    prompt: z.string(),
    agentId: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    tools: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          parameters: z.record(z.any()),
        })
      )
      .optional(),
    context: z.array(z.string()).optional(),
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
  {
    kbId: z.string(),
    query: z.string(),
    limit: z.number().optional(),
    metadata: z.record(z.any()).optional(),
    similarityThreshold: z.number().optional(),
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
  {
    kbId: z.string(),
    entries: z.array(
      z.object({
        text: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    ),
    upsert: z.boolean().optional(),
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
  {
    prompt: z.string(),
    model: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    numImages: z.number().optional(),
    quality: z.enum(["standard", "hd"]).optional(),
    style: z.string().optional(),
    negativePrompt: z.string().optional(),
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
  {
    prompt: z.string(),
    provider: z.enum(["dalle", "stable-diffusion", "midjourney"]).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    numImages: z.number().optional(),
    quality: z.enum(["standard", "hd"]).optional(),
    style: z.string().optional(),
    negativePrompt: z.string().optional(),
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
  {
    code: z.string(),
    dependencies: z.record(z.string()).optional(),
    timeout: z.number().optional(),
    memory: z.number().optional(),
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
  {
    code: z.string(),
    dependencies: z.array(z.string()).optional(),
    timeout: z.number().optional(),
    memory: z.number().optional(),
    saveOutputFiles: z.boolean().optional(),
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
