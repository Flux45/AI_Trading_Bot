import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Domain Routes (SOLID: Single Responsibility & Interface Segregation)
import { marketRoutes } from "./server/routes/marketRoutes.ts";
import { tradingRoutes } from "./server/routes/tradingRoutes.ts";
import { autonomousRoutes } from "./server/routes/autonomousRoutes.ts";
import { newsRoutes } from "./server/routes/newsRoutes.ts";
import { analysisRoutes } from "./server/routes/analysisRoutes.ts";
import { myStocksRoutes } from "./server/routes/myStocksRoutes.ts";
import { systemRoutes } from "./server/routes/systemRoutes.ts";
import { algoBotRoutes } from "./server/routes/algoBotRoutes.ts";
import { titansRoutes } from "./server/routes/titansRoutes.ts";
import { analystRoutes } from "./server/routes/analystRoutes.ts";
import { reportRoutes } from "./server/routes/reportRoutes.ts";

// Core Background Engines
import { initAutonomousEngine } from "./server/services/autonomousService.ts";
import { initNewsEngine } from "./server/services/newsSentimentService.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json());

// Mount Domain API Routers
app.use(marketRoutes);
app.use(tradingRoutes);
app.use(autonomousRoutes);
app.use(newsRoutes);
app.use(analysisRoutes);
app.use(myStocksRoutes);
app.use(systemRoutes);
app.use(algoBotRoutes);
app.use(titansRoutes);
app.use(analystRoutes);
app.use(reportRoutes);

// Boot background evaluation and news intelligence engines
initAutonomousEngine();
initNewsEngine();

// Vite Middleware for SPA Frontend
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI BOT ADVANCE] Quantitative Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
