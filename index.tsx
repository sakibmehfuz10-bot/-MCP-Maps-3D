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
import {ChatState, MapApp, marked} from './map_app.ts';
import {startMcpGoogleMapServer} from './mcp_maps_server.ts';

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
1.  **Identify Specific Locations First:** Before using 'view_location_google_maps' or 'directions_on_google_maps', you MUST first determine a specific, concrete place name, address, or well-known location.
    *   **GOOD Example:** User asks "Where is the southernmost town?" You think: "The southernmost permanently inhabited settlement is Puerto Williams, Chile." Then you call 'view_location_google_maps' with the query parameter: "Puerto Williams, Chile".
    *   **BAD Example:** User asks "Where is the southernmost town?" You call 'view_location_google_maps' with the query parameter: "southernmost town". This will not work.
    *   **GOOD Example:** User asks "Show me an interesting museum." You think: "The Louvre Museum in Paris is a very interesting museum." Then you call 'view_location_google_maps' with the query parameter: "Louvre Museum, Paris".
    *   **BAD Example:** User asks "Show me an interesting museum." You call 'view_location_google_maps' with the query parameter: "interesting museum". This will not work.
2.  **Clear Origin and Destination:** For 'directions_on_google_maps', ensure both 'origin' and 'destination' parameters are specific, recognizable place names or addresses.
3.  **Explain Your Actions:** After identifying a place and before (or as part of) calling a tool, clearly explain what location you are about to show or what directions you are providing.
4.  **Concise Text for Map Actions:** When a tool displays something on the map (e.g., shows a location or route), you don't need to state that you are doing it.
5.  **If unsure, ask for clarification:** If a user's request is too vague to identify a specific place for the map tools, ask for more details instead of making assumptions.
`;

/**
 * Initialize and start the application
 */
async function initializeApp() {
  try {
    // Validate API key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error(
        'API_KEY environment variable is not set. Please set GEMINI_API_KEY or API_KEY in your environment.'
      );
    }

    // Get root element
    const rootElement = document.querySelector('#root');
    if (!rootElement) {
      throw new Error('Root element (#root) not found in the DOM');
    }

    // Initialize GoogleGenAI with API key from environment
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Create MapApp component
    const mapApp = new MapApp();
    rootElement.appendChild(mapApp as unknown as Node);

    // Set up MCP communication
    const [transportA, transportB] = InMemoryTransport.createLinkedPair();

    // Start MCP server
    void startMcpGoogleMapServer(
      transportA,
      (params: {location?: string; origin?: string; destination?: string}) => {
        mapApp.handleMapQuery(params);
      },
    );

    // Start MCP client
    const mcpClient = await startClient(transportB);

    // Create AI chat instance
    function createAiChat(mcpClient: Client) {
      // Use gemini-2.0-flash for reliable performance and speed
      return ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTIONS,
          tools: [mcpToTool(mcpClient)],
        },
      });
    }

    const aiChat = createAiChat(mcpClient);

    // Set up message handler
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
        let stream;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount <= maxRetries) {
          try {
            stream = await aiChat.sendMessageStream({message: input});
            break; // Success, exit loop
          } catch (e: any) {
            const isRateLimit = 
              e?.message?.includes('429') || 
              e?.status === 429 || 
              (typeof e === 'string' && e.includes('429'));
            
            if (isRateLimit && retryCount < maxRetries) {
              retryCount++;
              const delay = Math.pow(2, retryCount) * 1000;
              console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw e;
          }
        }

        if (!stream) {
          throw new Error('Failed to initialize stream after retries');
        }

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
              }

              // Handle thinking process if supported by the model (e.g. gemini-3 series)
              if (part.thought) {
                mapApp.setChatState(ChatState.THINKING);
                thoughtAccumulator += ' ' + part.thought;
                thinkingElement.innerHTML =
                  await marked.parse(thoughtAccumulator);
                if (thinkingContainer) {
                  thinkingContainer.classList.remove('hidden');
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
        let finalErrorMessage = 'An error occurred while processing your request.';
        if (e instanceof Error) {
          finalErrorMessage = e.message;
        }
        
        const {textElement: errorTextElement} = mapApp.addMessage('error', '');
        errorTextElement.innerHTML = await marked.parse(
          `Error: ${finalErrorMessage}`,
        );
      } finally {
        if (thinkingContainer && !thoughtAccumulator) {
          thinkingContainer.classList.add('hidden');
        }

        const content = textElement.innerHTML.trim();
        if (content === '...' || content.length === 0) {
          textElement.innerHTML = '';
        }

        mapApp.setChatState(ChatState.IDLE);
      }
    };

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Show error in the error screen
    const errorDetailsElement = document.getElementById('error-details');
    if (errorDetailsElement) {
      errorDetailsElement.textContent = errorMessage;
    }
    
    const loadingScreen = document.getElementById('loading-screen');
    const errorScreen = document.getElementById('error-screen');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (errorScreen) errorScreen.style.display = 'flex';
    
    throw error;
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp().catch(console.error);
}
