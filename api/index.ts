import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

// Create Express app instance (singleton for serverless)
let appInstance: express.Application | null = null;

async function getApp(): Promise<express.Application> {
  if (appInstance) {
    return appInstance;
  }

  console.log("[vercel-api] Initializing Express app...");

  const app = express();

  // Middleware
  app.use(express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: false }));

  // CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.path?.startsWith("/api")) {
        console.log(`[vercel-api] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      }
    });
    next();
  });

  try {
    console.log("[vercel-api] Registering routes...");
    await registerRoutes(app);
    console.log("[vercel-api] Routes registered");
  } catch (error) {
    console.error("[vercel-api] Route registration error:", error);
    throw error;
  }

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[vercel-api] Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ 
      error: message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  });

  appInstance = app;
  console.log("[vercel-api] App initialized");
  return app;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    
    // @vercel/node automatically handles Express apps
    // Just pass the request/response directly
    return app(req as any, res as any);
  } catch (error) {
    console.error("[vercel-api] Handler error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      message,
      ...(process.env.NODE_ENV === "development" && {
        stack: error instanceof Error ? error.stack : undefined
      })
    });
  }
}
