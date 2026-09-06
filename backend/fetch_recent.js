import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import fs from "fs";
import path from "path";
import "dotenv/config";

const sessionPath = path.join(process.cwd(), ".telegram_session");
const savedSession = fs.existsSync(sessionPath) ? fs.readFileSync(sessionPath, "utf-8") : process.env.TELEGRAM_SESSION;
const client = new TelegramClient(new StringSession(savedSession), parseInt(process.env.TELEGRAM_API_ID), process.env.TELEGRAM_API_HASH, { connectionRetries: 1 });

async function run() {
  await client.start({
      phoneNumber: async () => "",
      password: async () => "",
      phoneCode: async () => "",
      onError: (err) => console.log(err),
  });
  
  console.log("Fetching recent dialogs...");
  const dialogs = await client.getDialogs({ limit: 5 });
  
  for (const dialog of dialogs) {
      console.log("-------------------");
      console.log(`Dialog: ${dialog.title} (ID: ${dialog.id})`);
      const messages = await client.getMessages(dialog.id, { limit: 2 });
      for (const m of messages) {
          console.log(`[${m.date}] ${m.out ? 'Me' : 'Them'}: ${m.message}`);
      }
  }
  process.exit(0);
}
run();
