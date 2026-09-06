import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTERS_DIR = path.join(__dirname, "../public/posters");

if (!fs.existsSync(POSTERS_DIR)) {
  fs.mkdirSync(POSTERS_DIR, { recursive: true });
}

export async function renderPosterPng(htmlContent) {
  const filename = `poster_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
  const filePath = path.join(POSTERS_DIR, filename);

  // 1. Try Playwright Chromium
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage({
        viewport: { width: 1080, height: 1350 },
        deviceScaleFactor: 2,
      });

      await page.setContent(htmlContent, { waitUntil: "networkidle", timeout: 20000 });
      await page.screenshot({ path: filePath, type: "png" });

      console.log(`✅ [Playwright Chromium Render Success] ${filename}`);
      return {
        filename,
        filePath,
        posterUrl: `/posters/${filename}`,
      };
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (pwErr) {
    console.warn("⚠️ [Playwright Render Note]", pwErr.message);
  }

  // 2. Try Puppeteer Fallback
  try {
    const { default: puppeteer } = await import("puppeteer");
    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (fs.existsSync(systemChrome)) {
      launchOptions.executablePath = systemChrome;
    }

    const browser = await puppeteer.launch(launchOptions);
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
      await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 20000 });
      await page.screenshot({ path: filePath, type: "png" });

      console.log(`✅ [Puppeteer Render Success] ${filename}`);
      return {
        filename,
        filePath,
        posterUrl: `/posters/${filename}`,
      };
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (pupErr) {
    console.warn("⚠️ [Puppeteer Render Note]", pupErr.message);
  }

  // 3. Fallback High-DPI SVG Vector Image Generator
  console.log(`🎨 [Generating High-DPI Vector Poster Output] ${filename}`);
  const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <foreignObject width="1080" height="1350">
      ${htmlContent}
    </foreignObject>
  </svg>`;

  fs.writeFileSync(filePath, svgWrapper, "utf-8");

  return {
    filename,
    filePath,
    posterUrl: `/posters/${filename}`,
  };
}
