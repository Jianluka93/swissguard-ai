console.log(">>> LOADING SERVER.TS <<<");
import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get the correct pdf parser function or class
function getPdfParser() {
  try {
    const mod = require("pdf-parse");
    
    // v2.4.5+ uses a class named PDFParse
    if (mod.PDFParse) return mod.PDFParse;
    // Classic pdf-parse is a function
    if (typeof mod === "function") return mod;
    // ESM default export
    if (mod.default) return mod.default;
    
    return null;
  } catch (e) {
    console.error(">>> getPdfParser FAILED <<<", e);
    return null;
  }
}

async function startServer() {
  console.log(">>> STARTING SERVER INITIALIZATION <<<");
  const app = express();
  const PORT = 3000;

  // 1. Logging Middleware
  app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  // 2. CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. API ROUTES
  console.log(">>> REGISTERING API ROUTES <<<");
  
  app.get("/api/health", (req, res) => {
    console.log(">>> HEALTH CHECK HIT <<<");
    const parser = getPdfParser();
    
    res.json({ 
      status: "ok", 
      message: "SwissGuard API is active", 
      timestamp: new Date().toISOString(),
      pdfParser: parser ? "available" : "missing",
      nodeEnv: process.env.NODE_ENV || "development"
    });
  });

  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
  });

  app.post(["/api/extract-text", "/api/extract-text/"], upload.single("file"), async (req: Request, res: Response) => {
    console.log(`>>> EXTRACT TEXT HIT: ${req.method} ${req.url} <<<`);
    try {
      const file = req.file;
      if (!file) {
        console.warn(">>> NO FILE IN REQUEST <<<");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`>>> PROCESSING FILE: ${file.originalname} (${file.mimetype}, ${file.size} bytes) <<<`);
      
      let extractedText = "";
      if (file.mimetype === "application/pdf") {
        const Parser = getPdfParser();
        if (!Parser) {
          console.error(">>> PDF PARSER NOT FOUND <<<");
          return res.status(500).json({ error: "PDF parser initialization failed." });
        }

        // Check if it's the new class-based API (v2.4.5+)
        if (Parser.prototype && typeof Parser.prototype.getText === "function") {
          console.log(">>> USING CLASS-BASED PDF-PARSE <<<");
          const instance = new Parser({ data: file.buffer });
          const result = await instance.getText();
          extractedText = result.text;
          if (typeof instance.destroy === "function") {
            await instance.destroy();
          }
        } else {
          console.log(">>> USING FUNCTION-BASED PDF-PARSE <<<");
          const data = await Parser(file.buffer);
          extractedText = data.text;
        }
      } else {
        extractedText = file.buffer.toString("utf-8");
      }

      if (!extractedText || extractedText.trim().length === 0) {
        console.warn(">>> EXTRACTION RESULTED IN EMPTY TEXT <<<");
        return res.status(400).json({ error: "Empty document" });
      }

      console.log(`>>> EXTRACTION SUCCESS: ${extractedText.length} characters <<<`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ text: extractedText });
    } catch (error) {
      console.error(">>> EXTRACTION ERROR <<<", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: String(error) });
    }
  });

  // Catch-all for other /api routes
  app.all("/api/*", (req, res) => {
    console.warn(">>> UNHANDLED API ROUTE <<<", req.url);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // 4. VITE / STATIC FILES
  if (process.env.NODE_ENV !== "production") {
    console.log(">>> VITE DEV MODE <<<");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(">>> VITE PROD MODE <<<");
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      console.warn(">>> DIST MISSING, FALLBACK TO DEV <<<");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }
  }

  // 5. Global Error Handler (Crucial to prevent HTML fallback on API errors)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(">>> GLOBAL ERROR HANDLER <<<", err);
    if (req.path.startsWith("/api/")) {
      return res.status(err.status || 500).json({ 
        error: err.message || "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    }
    next(err);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> SERVER LISTENING ON PORT ${PORT} <<<`);
  });
}

startServer().catch(err => {
  console.error(">>> FATAL SERVER ERROR <<<", err);
});
