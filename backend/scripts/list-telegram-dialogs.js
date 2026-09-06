import "dotenv/config";
import { client, startTelegram } from "../integrations/telegram.js";

async function run() {
  await startTelegram();
  console.log("🔍 Fetching Telegram Dialogs & caching entities...");
  const dialogs = await client.getDialogs({});

  const adwaythDialog = dialogs.find((d) => d.entity?.username === "Adwayth2007" || (d.title || d.name || "").includes("Adwayth"));

  if (adwaythDialog) {
    console.log(`📤 Sending PDF proposal to dialog: "${adwaythDialog.title || adwaythDialog.name}"...`);
    await client.sendMessage(adwaythDialog.inputEntity || adwaythDialog.id, {
      message: `🏠 *RealtyPulse PDF Property Proposal Catalog*\n\nThank you for speaking with our Voice Assistant, Adwayth (@adwayth2007)!\nWe matched 3BHK listings in Kakkanad under 1 Crore:\n\n📄 *Download Your Custom PDF Proposal Catalog:* https://gzip-durham-tested-namely.trycloudflare.com/proposals/proposal_PROP-210897.pdf\n\nContact us on WhatsApp or reply here on Telegram to book a site visit!`,
    });
    console.log("✅ PROPOSAL SENT SUCCESSFULLY TO @Adwayth2007 TELEGRAM APP!");
  } else {
    console.log("⚠️ Could not find @Adwayth2007 in dialogs list.");
  }
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
