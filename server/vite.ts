import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, the built files are in dist/public
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  console.log(`📁 Static files path: ${distPath}`);
  console.log(`📁 Directory exists: ${fs.existsSync(distPath)}`);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // List files in the directory for debugging
  const files = fs.readdirSync(distPath);
  console.log(`📄 Files in dist/public:`, files);

  // List files in assets directory specifically
  const assetsPath = path.resolve(distPath, "assets");
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    console.log(`📦 Asset files:`, assetFiles);
  }

  // Serve static files from the public directory with proper error handling
  app.use(express.static(distPath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Set proper MIME types
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  // Handle asset requests specifically with better error handling
  app.get('/assets/*', (req, res, next) => {
    try {
      const assetPath = path.resolve(distPath, req.path.substring(1)); // Remove leading /
      console.log(`📦 Serving asset: ${req.path} -> ${assetPath}`);
      
      if (fs.existsSync(assetPath)) {
        res.sendFile(assetPath);
      } else {
        console.log(`❌ Asset not found: ${assetPath}`);
        res.status(404).json({ error: 'Asset not found' });
      }
    } catch (error) {
      console.error(`❌ Error serving asset ${req.path}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Serve index.html for all other routes (SPA routing)
  app.get('*', (req, res, next) => {
    try {
      console.log(`🔄 Serving index.html for route: ${req.path}`);
      res.sendFile(path.resolve(distPath, "index.html"));
    } catch (error) {
      console.error(`❌ Error serving index.html:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
