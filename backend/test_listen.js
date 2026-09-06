import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import fs from "fs";
import path from "path";
import "dotenv/config";

const sessionPath = path.join(process.cwd(), ".telegram_session");
const savedSession = fs.existsSync(sessionPath) ? fs.readFileSync(sessionPath, "utf-8") : process.env.TELEGRAM_SESSION;
const client = new TelegramClient(new StringSession(savedSession), parseInt(process.env.TELEGRAM_API_ID), process.env.TELEGRAM_API_HASH, { connectionRetries: 1 });

client.addEventHandler((event) => {
    console.log("Raw event class:", event.className);
    if (event.className === "UpdateShortMessage" || event.className === "UpdateShortChatMessage") {
      console.log("SHORT MESSAGE:", event);
    }
    if (event.message) {
      console.log("MESSAGE:", event.message.message);
    }
});

async function run() {
  await client.start({
      phoneNumber: async () => "",
      password: async () => "",
      phoneCode: async () => "",
      onError: (err) => console.log(err),
  });
  console.log("Listening for raw events...");
  await client.getDialogs({ limit: 1 });
}
run();
