import { McpServer, StdioServerTransport } from "@modelcontextprotocol/sdk";
import { z } from "zod";

const server = new McpServer({
  name: "Expo MCP Optimizer",
  version: "1.0.0",
});

// Simple in-memory cache
const cache = new Map<string, any>();

// Batch request tool to reduce fast requests
server.tool(
  "batch",
  z.array(
    z.object({
      type: z.enum(["network", "cache", "state"]),
      data: z.any(),
    })
  ),
  async (requests) => {
    const responses = [];
    for (const { type, data } of requests) {
      if (type === "cache") {
        const { key, value } = data;
        if (value !== undefined) {
          cache.set(key, value);
          responses.push({ status: "cached", key });
        } else {
          responses.push({ key, value: cache.get(key) ?? null });
        }
      } else if (type === "network") {
        // Example: simulate network request or integrate your fetch logic here
        responses.push({ status: "fetched", url: data.url });
      } else {
        responses.push({ status: "unknown type", type });
      }
    }
    return { content: responses };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP server running...");
}

main().catch((err) => {
  console.error("Error starting MCP server:", err);
  process.exit(1);
});
