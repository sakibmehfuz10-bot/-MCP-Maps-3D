/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP Maps 3D - Main Application Entry Point
 * Simplified version optimized for Vercel deployment
 */

import { MapApp } from './map_app.ts';

/**
 * Initialize and start the application
 */
async function initializeApp() {
  try {
    console.log('🚀 Initializing MCP Maps 3D...');

    // Get root element
    const rootElement = document.querySelector('#root');
    if (!rootElement) {
      throw new Error('Root element (#root) not found in the DOM');
    }

    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }

    // Create and mount MapApp component
    console.log('📍 Creating MapApp component...');
    const mapApp = new MapApp();
    rootElement.appendChild(mapApp as unknown as Node);

    // Mark app as loaded
    document.body.classList.add('app-loaded');
    console.log('✅ Application initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Show error screen
    const loadingScreen = document.getElementById('loading-screen');
    const errorScreen = document.getElementById('error-screen');
    const errorDetails = document.getElementById('error-details');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (errorScreen) {
      errorScreen.style.display = 'flex';
      if (errorDetails) {
        errorDetails.textContent = errorMessage;
      }
    }
    
    throw error;
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp().catch(console.error);
}
