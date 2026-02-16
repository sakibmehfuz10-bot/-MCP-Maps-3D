
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This is the main entry point for the application.
 * It sets up the LitElement-based MapApp component, initializes the Google GenAI
 * client for chat interactions, and establishes communication between the
 * Model Context Protocol (MCP) client and server. The MCP server exposes
 * map-related tools that the AI model can use, and the client relays these
 * tool calls to the server.
 */

// Use correct import for GoogleGenAI
import {GoogleGenAI, mcpToTool} from '@google/genai';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {Transport} from '@modelcontextprotocol/sdk/shared/transport.js';
import {ChatState, MapApp, marked} from './map_app'; // Updated import path

import {startMcpGoogleMapServer} from './mcp_maps_server';

/* --------- */

async function startClient(transport: Transport) {
  const client = new Client({name: 'AI Studio', version: '1.0.0'});
  await client.connect(transport);
  return client;
}

/* ------------ */

const SYSTEM_INSTRUCTIONS = `You are an expert cartographer and travel guide, highly proficient with maps and discovering interesting places.
Your primary goal is to assist users by displaying relevant information on the interactive map using the available tools.

Tool Usage Guidelines:
1.  **Identify Specific Locations First:** Before using 'view_location_google_maps' or 'directions_on_google_maps', you MUST first determine a specific, concrete place name, address, or well-known landmark.
    *   **GOOD Example:** User asks "Where is the southernmost town?" You think: "The southernmost permanently inhabited settlement is Puerto Williams, Chile." Then you call 'view_location_google_maps' with the query parameter: "Puerto Williams, Chile".
    *   **BAD Example:** User asks "Where is the southernmost town?" You call 'view_location_google_maps' with the query parameter: "southernmost town". This will not work.
    *   **GOOD Example:** User asks "Show me an interesting museum." You think: "The Louvre Museum in Paris is a very interesting museum." Then you call 'view_location_google_maps' with the query parameter: "The Louvre Museum, Paris".
    *   **BAD Example:** User asks "Show me an interesting museum." You call 'view_location_google_maps' with the query parameter: "interesting museum". This will not work.
2.  **Clear Origin and Destination:** For 'directions_on_google_maps', ensure both 'origin' and 'destination' parameters are specific, recognizable place names or addresses.
3.  **Explain Your Actions:** After identifying a place and before (or as part of) calling a tool, clearly explain what location you are about to show or what directions you are providing. For example: "Okay, I'll show you Puerto Williams, Chile, which is the southernmost permanently inhabited settlement." or "Certainly, let's look at the Louvre Museum in Paris."
4.  **Concise Text for Map Actions:** When a tool displays something on the map (e.g., shows a location or route), you don't need to state that you are doing it (e.g., "Showing you X on the map" is redundant). The map action itself is sufficient. Instead, after the tool action, provide extra interesting facts or context about the location or route if appropriate.
5.  **If unsure, ask for clarification:** If a user's request is too vague to identify a specific place for the map tools (e.g., "Show me something cool"), ask for more details instead of making a tool call with vague parameters.`;

// Initialize GoogleGenAI with API key from environment
const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

function createAiChat(mcpClient: Client) {
  // Use gemini-3-pro-preview for complex reasoning and tool usage tasks
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS,
      tools: [mcpToTool(mcpClient)],
    },
  });
}

function camelCaseToDash(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

document.addEventListener('DOMContentLoaded', async (event) => {
  const rootElement = document.querySelector('#root')! as HTMLElement;

  const mapApp = new MapApp();
  // Fix: Cast mapApp to HTMLElement to resolve the 'not assignable to Node' error
  rootElement.appendChild(mapApp as unknown as HTMLElement);

  const [transportA, transportB] = InMemoryTransport.createLinkedPair();

  void startMcpGoogleMapServer(
    transportA,
    (params: {location?: string; origin?: string; destination?: string}) => {
      mapApp.handleMapQuery(params);
    },
  );

  const mcpClient = await startClient(transportB);
  const aiChat = createAiChat(mcpClient);

  mapApp.sendMessageHandler = async (input: string, role: string) => {
    console.log('sendMessageHandler', input, role);

    const {thinkingElement, textElement, thinkingContainer} = mapApp.addMessage(
      'assistant',
      '',
    );

    mapApp.setChatState(ChatState.GENERATING);
    textElement.innerHTML = '...'; // Initial placeholder

    let newCode = '';
    let thoughtAccumulator = '';

    try {
      try {
        const stream = await aiChat.sendMessageStream({message: input});

        for await (const chunk of stream) {
          for (const candidate of chunk.candidates ?? []) {
            for (const part of candidate.content?.parts ?? []) {
              if (part.functionCall) {
                // Execute the function call via MCP, but don't display the JSON in the chat
                console.log(
                  'FUNCTION CALL:',
                  part.functionCall.name,
                  part.functionCall.args,
                );
                // Note: The execution happens automatically through the MCP tools injected into the chat.
                // We just log it for debugging purposes.
              }

              // Handle thinking process if supported by the model (e.g. gemini-3 series)
              if (part.thought) {
                mapApp.setChatState(ChatState.THINKING);
                thoughtAccumulator += ' ' + part.thought;
                thinkingElement.innerHTML =
                  await marked.parse(thoughtAccumulator);
                if (thinkingContainer) {
                  thinkingContainer.classList.remove('hidden');
                  // Keep it collapsed by default for a cleaner look
                }
              } else if (part.text) {
                mapApp.setChatState(ChatState.EXECUTING);
                newCode += part.text;
                textElement.innerHTML = await marked.parse(newCode);
              }
              mapApp.scrollToTheEnd();
            }
          }
        }
      } catch (e: unknown) {
        console.error('GenAI SDK Error:', e);
        let finalErrorMessage = "An error occurred while processing your request.";
        if (e instanceof Error) finalErrorMessage = e.message;
        
        const {textElement: errorTextElement} = mapApp.addMessage('error', '');
        errorTextElement.innerHTML = await marked.parse(
          `Error: ${finalErrorMessage}`,
        );
      }

      if (thinkingContainer && !thoughtAccumulator) {
        thinkingContainer.classList.add('hidden');
      }

      if (
        textElement.innerHTML.trim() === '...' ||
        textElement.innerHTML.trim().length === 0
      ) {
         // If no text was generated, just clear the placeholder
         textElement.innerHTML = '';
      }
    } finally {
      mapApp.setChatState(ChatState.IDLE);
    }
  };
});
