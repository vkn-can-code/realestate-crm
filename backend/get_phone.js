import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import fs from "fs";
import path from "path";
import "dotenv/config";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionPath = path.join(process.cwd(), ".telegram_session");
let savedSession = process.env.TELEGRAM_SESSION || "";
if (fs.existsSync(sessionPath)) {
  savedSession = fs.readFileSync(sessionPath, "utf-8");
}
const stringSession = new StringSession(savedSession);

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 1,
});

async function run() {
  await client.connect();
  const me = await client.getMe();
  console.log("Phone number:", me.phone);
  process.exit(0);
}
run();
