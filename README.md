# MCP Maps 3D - Interactive 3D Mapping Application

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

An interactive 3D mapping application powered by **Google Maps 3D**, **Gemini AI**, and the **Model Context Protocol (MCP)**. This application allows users to explore locations, get directions, and interact with an AI-powered cartographer through a natural language interface.

## Features

- **3D Interactive Maps**: Explore locations in stunning 3D using Google Maps 3D
- **AI-Powered Navigation**: Ask the AI assistant to show you places, get directions, and discover interesting locations
- **Real-time Directions**: Get turn-by-turn directions between any two locations
- **Performance Optimization**: Toggle between high-detail and high-performance rendering modes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Comprehensive error handling and user-friendly error messages

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **pnpm**: Version 10.0.0 or higher (recommended) or npm/yarn
- **API Keys**:
  - [Gemini API Key](https://ai.google.dev/) - for AI chat functionality
  - [Google Maps API Key](https://console.cloud.google.com/) - for map rendering and geocoding

## API Key Setup

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key in Google Cloud Console
4. Copy your API key

### 2. Get Google Maps API Key
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Routes API
   - Maps 3D API
4. Create an API key (Application Restrictions: HTTP referrers)
5. Copy your API key

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/sakibmehfuz10-bot/-MCP-Maps-3D.git
cd -MCP-Maps-3D
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NODE_ENV=development
```

## Development

### Run the Development Server
```bash
pnpm run dev
```

The application will start at `http://localhost:5173`

### Build for Production
```bash
pnpm run build
```

The production build will be created in the `dist/` directory.

### Preview Production Build
```bash
pnpm run preview
```

### Type Checking
```bash
pnpm run lint
# or
pnpm run type-check
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Production ready build"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Visit [Vercel Dashboard](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Configure build settings:
     - **Framework**: Vite
     - **Build Command**: `pnpm run build`
     - **Output Directory**: `dist`

3. **Set Environment Variables**:
   - In Vercel project settings, go to "Environment Variables"
   - Add:
     - `GEMINI_API_KEY`: Your Gemini API key
     - `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
     - `NODE_ENV`: `production`

4. **Deploy**:
   - Vercel will automatically deploy your application
   - Your app will be available at `https://your-project.vercel.app`

### Deploy to Other Platforms

#### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm run build
EXPOSE 4173
CMD ["pnpm", "run", "preview"]
```

Build and run:
```bash
docker build -t mcp-maps-3d .
docker run -p 4173:4173 \
  -e GEMINI_API_KEY=your_key \
  -e GOOGLE_MAPS_API_KEY=your_key \
  mcp-maps-3d
```

#### Traditional Server (Node.js)
1. Build the application: `pnpm run build`
2. Copy the `dist/` folder to your server
3. Serve using a static file server (nginx, Apache, etc.)
4. Set environment variables on the server

## Project Structure

```
├── index.html              # Main HTML entry point
├── index.tsx               # Application entry point
├── index.css               # Global styles
├── map_app.ts              # MapApp LitElement component
├── mcp_maps_server.ts      # MCP server implementation
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Project dependencies
├── .env.example            # Environment variables template
└── dist/                   # Production build output
```

## Troubleshooting

### White Screen Issue
- **Check browser console** for JavaScript errors
- **Verify API keys** are correctly set in `.env.local`
- **Clear browser cache** and hard refresh (Ctrl+Shift+R)
- **Check network tab** for failed API requests

### "Page Not Found" Error
- Ensure the build was successful: `pnpm run build`
- Verify the `dist/` folder contains `index.html`
- Check that the web server is configured to serve `index.html` for all routes

### Map Not Loading
- Verify Google Maps API key is valid
- Ensure Maps 3D API is enabled in Google Cloud Console
- Check that API key restrictions allow your domain

### AI Chat Not Working
- Verify Gemini API key is valid
- Check that the API key has sufficient quota
- Review browser console for error messages

## System Instructions for AI

The AI assistant uses the following system instructions:

1. **Identify Specific Locations**: Always determine a concrete place name before using map tools
2. **Clear Parameters**: Provide specific origin and destination for directions
3. **Explain Actions**: Explain what location you're showing before displaying it
4. **Concise Responses**: Keep responses brief when displaying map content
5. **Ask for Clarification**: If requests are vague, ask for more details

## Performance Tips

- **Toggle Performance Mode**: Use the "High Perf" button to reduce rendering overhead
- **Optimize API Calls**: Limit the number of simultaneous requests
- **Use Caching**: Browser caching reduces API calls for repeated requests

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

## Acknowledgments

- [Google Maps Platform](https://developers.google.com/maps)
- [Google Gemini API](https://ai.google.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Lit](https://lit.dev/)
- [Vite](https://vitejs.dev/)
