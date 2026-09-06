import "dotenv/config";
import fs from "fs";
import path from "path";

async function configureVapiAssistant() {
  const apiKey = process.env.VAPI_PRIVATE_API_KEY;
  let assistantId = process.env.VAPI_ASSISTANT_ID;
  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5001";

  console.log("\n=======================================================");
  console.log("🛠️  VAPI ASSISTANT AUTOMATED SETUP & SYNC SCRIPT");
  console.log("=======================================================");
  console.log(`Public Base URL: ${baseUrl}`);
  console.log(`Custom LLM URL: ${baseUrl}/api/vapi/llm`);
  console.log(`Server Webhook URL: ${baseUrl}/api/vapi/webhook`);

  if (!apiKey) {
    console.error("\n❌ ERROR: Missing VAPI_PRIVATE_API_KEY in backend/.env!");
    process.exit(1);
  }

  const payload = {
    name: "AIRA Real Estate Assistant",
    model: {
      provider: "custom-llm",
      model: "custom-llm-n8n",
      url: `${baseUrl}/api/vapi/llm`,
    },
    voice: {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM",
    },
    serverUrl: `${baseUrl}/api/vapi/webhook`,
    firstMessage: "Hi! 👋 Welcome to RealtyPulse. I'm Aira. Are you looking to BUY, SELL, RENT IN, or RENT OUT a property in Kochi?",
    analysisPlan: {
      structuredDataSchema: {
        type: "object",
        properties: {
          location: { type: "string", description: "Preferred property location, e.g., Kakkanad" },
          email: { type: "string", description: "Client email address provided during the call" },
          maxBudget: { type: "number", description: "Maximum budget in INR" },
          bedrooms: { type: "number", description: "Number of BHK bedrooms" },
          listingIntent: { type: "string", description: "buy, rent_in, sell, or rent_out" }
        }
      }
    }
  };

  // Step 1: Try PATCH if assistantId exists
  let isConfigured = false;

  if (assistantId) {
    console.log(`\n[Vapi API] Checking existing assistant ${assistantId}...`);
    try {
      const patchRes = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (patchRes.ok) {
        const data = await patchRes.json();
        console.log("✅ SUCCESS! Existing Vapi Assistant updated cleanly.");
        isConfigured = true;
      }
    } catch (e) {
      console.warn("[Vapi API Note]", e.message);
    }
  }

  // Step 2: If no assistantId or 404, create a NEW Assistant automatically via Vapi API!
  if (!isConfigured) {
    console.log("\n[Vapi API] Creating a brand-new AIRA Assistant in your Vapi Account...");
    try {
      const createRes = await fetch("https://api.vapi.ai/assistant", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await createRes.json();

      if (createRes.ok && data.id) {
        assistantId = data.id;
        console.log("🎉 SUCCESS! Created AIRA Assistant in Vapi Account!");
        console.log(`   Assistant ID: ${assistantId}`);
        console.log(`   Model Provider: ${data.model?.provider}`);
        console.log(`   Custom LLM URL: ${data.model?.url}`);
        console.log(`   Server Webhook URL: ${data.serverUrl}`);

        // Update backend/.env automatically
        const envPath = path.join(process.cwd(), ".env");
        let envContent = fs.readFileSync(envPath, "utf8");
        if (envContent.includes("VAPI_ASSISTANT_ID=")) {
          envContent = envContent.replace(/VAPI_ASSISTANT_ID=.*/g, `VAPI_ASSISTANT_ID=${assistantId}`);
        } else {
          envContent += `\nVAPI_ASSISTANT_ID=${assistantId}\n`;
        }
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Saved VAPI_ASSISTANT_ID=${assistantId} directly into backend/.env!`);
      } else {
        console.error("❌ FAILED creating assistant:", JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error("❌ ERROR creating assistant:", err.message);
    }
  }

  console.log("=======================================================\n");
}

configureVapiAssistant();
