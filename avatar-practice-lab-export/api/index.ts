import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { avatarSimulator } from "./routes/avatar-simulator.js";
import { adminRouter } from "./routes/admin.js";
import { interviewRouter } from "./routes/interview.js";
import { exerciseModeRouter } from "./routes/exercise-mode.js";
import { setupAuth } from "./replitAuth.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const PORT = isProduction ? 5000 : Number(process.env.API_PORT || 3001);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache control for development
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

async function startServer() {
  // Set up username/password auth
  await setupAuth(app);

  // Middleware to populate req.user from session for all avatar routes
  app.use("/api/avatar", (req, res, next) => {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      req.user = sessionUser;
    }
    next();
  });

  // Mount avatar simulator routes
  app.use("/api/avatar", avatarSimulator);

  // Mount admin routes
  app.use("/api/admin", adminRouter);

  // Middleware to populate req.user from session for interview routes
  app.use("/api/interview", (req, res, next) => {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      req.user = sessionUser;
    }
    next();
  });

  // Mount interview practice routes
  app.use("/api/interview", interviewRouter);

  // Middleware to populate req.user from session for exercise mode routes
  app.use("/api/exercise-mode", (req, res, next) => {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      req.user = sessionUser;
    }
    next();
  });

  // Mount interview exercise mode routes (Case Study + Coding Lab)
  app.use("/api/exercise-mode", exerciseModeRouter);

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve static files in production
  if (isProduction) {
    // In production, code runs from dist/api/index.js, so go up to dist/ then into client/
    const distPath = path.join(__dirname, "..", "client");
    app.use(express.static(distPath));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Avatar Practice Lab API server running on port ${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
