import "dotenv/config";
import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import readline from "readline";
import fs from "fs";
import path from "path";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionPath = path.join(process.cwd(), ".telegram_session");

function ask(questionText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(questionText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function authenticate() {
  console.log("=== TELEGRAM AUTHENTICATION ===");
  if (!apiId || !apiHash) {
    console.error("❌ TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in your .env file!");
    process.exit(1);
  }

  // Delete existing corrupted session file if it exists
  if (fs.existsSync(sessionPath)) {
    console.log("Deleting old corrupted session file...");
    fs.unlinkSync(sessionPath);
  }

  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () => await ask("Enter your Telegram phone number (with country code, e.g. +91...): "),
      password: async () => await ask("Enter your 2FA password (if any, otherwise leave blank): "),
      phoneCode: async () => await ask("Enter the login code you received on Telegram: "),
      onError: (err) => console.log("Authentication Error:", err),
    });

    console.log("✅ Successfully authenticated!");
    const sessionString = client.session.save();
    
    fs.writeFileSync(sessionPath, sessionString, "utf-8");
    console.log(`✅ Session saved to ${sessionPath}`);
    console.log("You can now restart the backend server!");
  } catch (error) {
    console.error("❌ Failed to authenticate:", error);
  } finally {
    process.exit(0);
  }
}

authenticate();
