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
  
  // First, we must get the entity to cache it in the session
  const dialogs = await client.getDialogs({ limit: 10 });
  const userDialog = dialogs.find(d => d.id.toString() === "1488306613");
  
  if (userDialog) {
      await client.sendMessage(userDialog.entity, { message: "Test: Sending an outbound message from the bot to verify connection. If you see this, please reply!" });
      console.log("Outbound message sent successfully.");
  } else {
      console.log("Could not find the user in recent dialogs.");
  }
  process.exit(0);
}
run();
