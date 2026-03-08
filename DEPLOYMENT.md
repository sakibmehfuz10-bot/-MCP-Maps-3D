# MCP Maps 3D - Deployment Guide

This guide provides step-by-step instructions for deploying the MCP Maps 3D application to various environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Vercel Deployment](#vercel-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Traditional Server Deployment](#traditional-server-deployment)
6. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All TypeScript code passes linting: `pnpm run lint`
- [ ] Production build completes successfully: `pnpm run build`
- [ ] `dist/` folder contains all necessary files
- [ ] API keys are valid and have proper permissions
- [ ] All required Google Maps APIs are enabled
- [ ] Environment variables are configured correctly

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyD...` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIzaSyC...` |
| `NODE_ENV` | Environment (development/production) | `production` |

### Getting API Keys

#### Gemini API Key
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key in Google Cloud Console
4. Copy and save the key

#### Google Maps API Key
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Routes API
   - Maps 3D API
4. Create an API key with appropriate restrictions
5. Copy and save the key

## Vercel Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### Step 2: Connect to Vercel
1. Visit [Vercel Dashboard](https://vercel.com)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

### Step 3: Configure Build Settings
In Vercel project settings:

**Build & Development Settings:**
- Framework: Vite
- Build Command: `pnpm run build`
- Output Directory: `dist`
- Install Command: `pnpm install`

**Environment Variables:**
Add the following in "Environment Variables":
```
GEMINI_API_KEY=your_gemini_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
NODE_ENV=production
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for the deployment to complete
3. Your app will be available at `https://your-project.vercel.app`

### Vercel Specific Notes
- The `vercel.json` file handles routing and rewrites
- All routes are rewritten to `index.html` for SPA support
- Static assets are cached with long expiration times
- Security headers are automatically applied

## Docker Deployment

### Step 1: Create Dockerfile
A `Dockerfile` is provided in the repository. Build the image:

```bash
docker build -t mcp-maps-3d:latest .
```

### Step 2: Run Container
```bash
docker run -p 4173:4173 \
  -e GEMINI_API_KEY=your_gemini_key \
  -e GOOGLE_MAPS_API_KEY=your_google_maps_key \
  -e NODE_ENV=production \
  mcp-maps-3d:latest
```

### Step 3: Access Application
Visit `http://localhost:4173` in your browser

### Docker Compose (Optional)
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mcp-maps-3d:
    build: .
    ports:
      - "4173:4173"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
      NODE_ENV: production
```

Run with:
```bash
docker-compose up
```

## Traditional Server Deployment

### Step 1: Build Application
```bash
pnpm install
pnpm run build
```

### Step 2: Deploy to Server
Copy the `dist/` folder to your web server:

```bash
scp -r dist/ user@your-server:/var/www/mcp-maps-3d/
```

### Step 3: Configure Web Server

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/mcp-maps-3d;
    index index.html;

    # Serve static assets with long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Rewrite all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/mcp-maps-3d

    <Directory /var/www/mcp-maps-3d>
        Options -MultiViews
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.html [QSA,L]
    </Directory>

    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>

    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

### Step 4: Set Environment Variables
Create `.env` file on the server or set system environment variables:

```bash
export GEMINI_API_KEY=your_gemini_key
export GOOGLE_MAPS_API_KEY=your_google_maps_key
export NODE_ENV=production
```

### Step 5: Enable HTTPS
Use Let's Encrypt for free SSL certificates:

```bash
certbot certonly --webroot -w /var/www/mcp-maps-3d -d your-domain.com
```

## Troubleshooting

### White Screen Issue
1. **Check browser console** (F12) for JavaScript errors
2. **Verify API keys** are set correctly
3. **Clear browser cache** (Ctrl+Shift+Delete)
4. **Hard refresh** (Ctrl+Shift+R)
5. **Check network tab** for failed requests

### 404 Errors
- Ensure web server is configured to rewrite all routes to `index.html`
- Verify `dist/index.html` exists
- Check file permissions (should be readable by web server)

### Map Not Loading
- Verify Google Maps API key is valid
- Ensure Maps 3D API is enabled in Google Cloud Console
- Check API key restrictions allow your domain
- Review browser console for specific error messages

### API Errors
- Verify API keys are correct
- Check API quotas haven't been exceeded
- Ensure APIs have proper permissions
- Review Google Cloud Console for any errors

### Performance Issues
- Enable gzip compression on web server
- Use CDN for static assets
- Monitor application performance
- Check browser DevTools for bottlenecks

## Monitoring & Maintenance

### Monitor Application
- Set up error tracking (e.g., Sentry)
- Monitor API usage and quotas
- Track application performance
- Set up uptime monitoring

### Regular Maintenance
- Keep dependencies updated: `pnpm update`
- Monitor security advisories: `pnpm audit`
- Review and rotate API keys periodically
- Backup configuration and data

## Support

For deployment issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review browser console for error messages
3. Check Google Cloud Console for API errors
4. Open an issue on GitHub

---

**Last Updated**: March 2026
**Version**: 1.0.0
