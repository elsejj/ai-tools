
import { Client } from "@modelcontextprotocol/sdk/client/index";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse";
import { ChatCompletionTool } from "openai/resources/chat";



export async function connectMcpClient(url: string, transport: "sse" | "stream") : Promise<Client> {
  const u = new URL(url);


  const controller = new AbortController();
  const signal = controller.signal;
  const response = await fetch(u, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
  }
  controller.abort();

  const client = new Client({
    name: "aiTools",
    version: "1.0.0",
  });

  if (transport === "sse") {
    const transport = new SSEClientTransport(u)
    transport.onerror = (err) => {
      console.error("Transport error:", err);
      transport.close();
    };
    await client.connect(transport);
  } else {
    throw new Error("Unsupported transport type");
  }

  return client;
}

export async function mcpListTools(client: Client) : Promise<ChatCompletionTool[]> {
  const resp = await client.listTools();
  return resp.tools.map(tool => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }
  }));
}

export async function mcpCallTool(client: Client, name: string, args: string) : Promise<any> {
  const parsedArgs = JSON.parse(args);
  console.log("start calling tool", name, parsedArgs);
 
  const resp = await client.callTool({
    name,
    arguments: parsedArgs,
  });
  console.log("Response from tool:", resp);
  return resp.content;
}