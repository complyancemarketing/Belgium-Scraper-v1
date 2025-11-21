import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

// Create Express app instance (singleton for serverless)
let appInstance: express.Application | null = null;

async function initializeApp(): Promise<express.Application> {
  if (appInstance) {
    return appInstance;
  }

  const app = express();

  // Middleware
  app.use(express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: false }));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
      }
    });

    next();
  });

  // Register API routes
  await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  appInstance = app;
  return app;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await initializeApp();
  
  // Use Vercel's built-in Express support
  return app(req, res);
}
