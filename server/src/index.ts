import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { activityRouter } from "./routes/activity.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { detailSubmissionsRouter } from "./routes/detailSubmissions.js";
import { detailsRouter } from "./routes/details.js";
import { factsRouter } from "./routes/facts.js";
import { kpiTargetsRouter } from "./routes/kpiTargets.js";
import { orgSettingsRouter } from "./routes/orgSettings.js";
import { submissionsRouter } from "./routes/submissions.js";
import { templateOverflowRouter } from "./routes/templateOverflow.js";
import { uploadsRouter } from "./routes/uploads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());
app.use(express.json({ limit: "2mb" }));

const corsOrigins = (process.env.CORS_ORIGINS ?? "").split(",").filter(Boolean);
if (corsOrigins.length > 0) app.use(cors({ origin: corsOrigins, credentials: true }));

// Auth endpoints get a tighter rate limit — this is the one surface a brute-force attempt would
// actually target; everything else is either public dashboard reads or already behind a JWT.
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }));
app.use("/api/auth/forgot-password", rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false }));

app.use("/api/auth", authRouter);
app.use("/api/admin/users", adminRouter);
app.use("/api/facts", factsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/details", detailsRouter);
app.use("/api/detail-submissions", detailSubmissionsRouter);
app.use("/api/org-settings", orgSettingsRouter);
app.use("/api/kpi-targets", kpiTargetsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/template-overflow", templateOverflowRouter);
app.use("/api/activity", activityRouter);

// Serves the frontend's built static files (the Vite `dist/` output) directly from this same
// process — one container to run on the internal server, no separate web server required. A
// path that isn't a static file or an /api/* route falls through to index.html, so client-side
// routing (?screen=... query params this app already uses) keeps working on a hard refresh.
const FRONTEND_DIST = process.env.FRONTEND_DIST ?? path.join(__dirname, "../../dist");
app.use(express.static(FRONTEND_DIST));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

// Error-handling middleware must be registered last — Express only routes a thrown/rejected
// error here if it comes after every other app.use()/app.get() (and, with Express 5, every
// async route handler above now forwards its rejections here automatically).
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Something went wrong." });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`pksof backend listening on :${port}`);
});
