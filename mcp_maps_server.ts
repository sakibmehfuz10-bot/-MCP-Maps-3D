/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP Maps Server - Simplified version for Vercel compatibility
 * This file is kept for reference but not used in the simplified build
 */

export interface MapParams {
  location?: string;
  origin?: string;
  destination?: string;
}

/**
 * Placeholder function - MCP functionality is disabled in simplified version
 * To enable full MCP features, use the full version with proper bundling
 */
export async function startMcpGoogleMapServer(
  transport: any,
  mapQueryHandler: (params: MapParams) => void,
) {
  console.log('MCP Server: Simplified mode - MCP functionality disabled');
  console.log('To enable MCP features, configure Gemini API key in environment variables');
}
