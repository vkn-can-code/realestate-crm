import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import { NewMessage } from "teleproto/events/index.js";
import readline from "readline";
import fs from "fs";
import path from "path";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionPath = path.join(process.cwd(), ".telegram_session");
let savedSession = process.env.TELEGRAM_SESSION || "";
if (fs.existsSync(sessionPath)) {
  savedSession = fs.readFileSync(sessionPath, "utf-8");
}
const stringSession = new StringSession(savedSession);

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

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 10,
});

export async function startTelegram() {
  console.log("\n📱 Starting Telegram connection...");

  await client.start({
    phoneNumber: async () => {
      return await ask(
        "Telegram phone number (+countrycode...): "
      );
    },

    phoneCode: async () => {
      return await ask(
        "Telegram login code: "
      );
    },

    password: async () => {
      return await ask(
        "Telegram 2FA password: "
      );
    },

    onError: (error) => {
      console.error("Telegram authentication error:", error);
    },
  });

  console.log("\n================================");
  console.log("✅ TELEGRAM CONNECTED (CHANNEL ADAPTER ACTIVE)");
  console.log("================================");

  const me = await client.getMe();

  console.log("Name:", me.firstName || "");
  console.log("Username:", me.username || "No username");
  console.log("Telegram ID:", me.id?.toString());

  // Save the authenticated session string to a persistent local file
  const newSessionString = client.session.save();
  if (newSessionString) {
    fs.writeFileSync(sessionPath, newSessionString, "utf-8");
  }

  // Primary Event Handler for All Incoming Telegram Messages
  client.addEventHandler(
    async (event) => {
      try {
        const message = event.message;
        if (!message) {
          return;
        }

        let sender = null;
        try {
          sender = await message.getSender();
        } catch (e) {
          // Fallback
        }

        const senderIdStr = sender?.id?.toString() || message.senderId?.toString() || "Unknown";
        const senderName = sender
          ? `${sender.firstName || ""} ${sender.lastName || ""}`.trim() || sender.username || "Client"
          : `Client (${senderIdStr})`;
        const rawText = (message.message || "").trim();
        if (!rawText) {
          return;
        }

        // Ignore outgoing messages sent by the bot itself (COMMENTED OUT FOR TESTING)
        if (message.out) {
          console.log("📲 RECEIVED OUTGOING MESSAGE (Ignored by logic, but handler fired!)");
          // return; // Keep it commented so we can test sending to ourselves
        } else {
          console.log("\n================================");
          console.log("📲 TELEGRAM ADAPTER: INCOMING");
          console.log("================================");
          console.log("Sender ID:", senderIdStr);
          console.log("Sender Name:", senderName);
          console.log("Message:", rawText);
          console.log("================================\n");
        }

        // Normalize message format for the common AI engine
        const normalizedPayload = {
          channel: "telegram",
          conversationId: `telegram:${senderIdStr}`,
          customerId: senderIdStr,
          customerName: senderName,
          message: rawText,
          timestamp: new Date().toISOString(),
        };

        // Forward to Node.js / Express AI Engine Endpoint
        const port = process.env.PORT || 5001;
        const res = await fetch(`http://localhost:${port}/api/ai/incoming`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedPayload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply && !message.out) { // Don't reply to our own test messages
            console.log(`[Telegram Adapter] Sending AI Reply to ${senderName}:`);
            console.log(data.reply);
            await client.sendMessage(senderIdStr, { message: data.reply });
          }
        } else {
          console.error(`[Telegram Adapter] AI Engine returned error status ${res.status}`);
        }
      } catch (error) {
        console.error(
          "Telegram channel adapter processing error:",
          error
        );
      }
    },
    new NewMessage({})
  );

  console.log("\n👂 Listening for incoming Telegram messages...\n");

  // Force fetch dialogs to wake up the MTProto update loop
  try {
    await client.getDialogs({ limit: 1 });
  } catch (err) {
    // ignore
  }

  // Auto-reconnect heartbeat: Checks Telegram socket every 10s and reconnects if network drops
  setInterval(async () => {
    try {
      if (!client.connected) {
        console.warn("⚠️ Telegram socket disconnected. Reconnecting...");
        await client.connect();
        console.log("✅ Telegram client reconnected successfully!");
      } else {
        // Active Ping to keep connection alive and force update catch-up
        await client.getMe();
      }
    } catch (e) {
      // Suppress temporary network glitches, will retry next interval
    }
  }, 30000);

  return client;
}

/**
 * Searches Telegram by phone number (imports contact), resolves the Telegram user entity/ID,
 * and sends an outbound Telegram message directly to the contact!
 */
export async function sendTelegramMessageByPhone({ phone, name = "Client", message }) {
  if (!client || !client.connected) {
    throw new Error("Telegram client is not connected. Please check your Telegram session and restart the backend.");
  }

  const cleanPhone = (phone || "").replace(/[^0-9+]/g, "");
  const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;

  console.log(`[Telegram Resolver] Searching Telegram for contact with phone: ${formattedPhone}...`);

  try {
    let entity = null;
    try {
      entity = await client.getEntity(formattedPhone);
    } catch (e) {
      // Entity not cached yet in session
    }

    if (!entity) {
      // Import contact via Telegram API (contacts.ImportContacts)
      const importResult = await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: BigInt(Date.now()),
              phone: formattedPhone,
              firstName: name.split(" ")[0] || "Client",
              lastName: name.split(" ").slice(1).join(" ") || "",
            }),
          ],
        })
      );

      if (importResult.users && importResult.users.length > 0) {
        entity = importResult.users[0];
      }
    }

    if (!entity) {
      throw new Error(`Phone number ${formattedPhone} is not registered on Telegram or privacy settings block contact search.`);
    }

    const targetUserId = entity.id ? entity.id.toString() : entity;

    console.log(`✅ [Telegram Contact Found] Resolved phone ${formattedPhone} to Telegram User ID: ${targetUserId}`);

    // Send message to resolved Telegram contact
    await client.sendMessage(entity, { message });

    return {
      status: "sent",
      telegramUserId: targetUserId,
      phone: formattedPhone,
      recipientName: entity.firstName ? `${entity.firstName} ${entity.lastName || ""}`.trim() : name,
    };
  } catch (err) {
    console.error(`[Telegram Phone Search Error] ${err.message}`);
    throw err;
  }
}

export { client };
