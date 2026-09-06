import "dotenv/config";

async function runVapiTests() {
  console.log("\n=======================================================");
  console.log("🧪 RUNNING VAPI INTEGRATION AUTOMATED TESTS");
  console.log("=======================================================\n");

  const baseUrl = "http://localhost:5001";

  // TEST 1: Mock Vapi Custom LLM Request (POST /api/vapi/llm)
  console.log("▶️ TEST 1: Testing POST /api/vapi/llm (OpenAI Chat Completion Wrapper)...");
  const llmRequestPayload = {
    model: "custom-llm-n8n",
    messages: [
      { role: "system", content: "You are Aira, AI Real Estate Assistant." },
      { role: "user", content: "I am looking to buy a 3BHK villa in Kakkanad" },
    ],
    call: {
      id: "test-call-vapi-99",
      customer: {
        number: "+919633541720",
      },
    },
  };

  try {
    const llmRes = await fetch(`${baseUrl}/api/vapi/llm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(llmRequestPayload),
    });

    const llmData = await llmRes.json();
    console.log(`   HTTP Status: ${llmRes.status}`);
    console.log(`   Response Object: "${llmData.object}"`);
    console.log(`   Choices Length: ${llmData.choices?.length}`);
    console.log(`   AI Spoken Reply: "${llmData.choices?.[0]?.message?.content}"`);

    if (
      llmRes.status === 200 &&
      llmData.object === "chat.completion" &&
      llmData.choices &&
      llmData.choices[0]?.message?.content
    ) {
      console.log("✅ TEST 1 PASSED: /api/vapi/llm returns valid OpenAI Chat Completion JSON format!\n");
    } else {
      console.error("❌ TEST 1 FAILED: Unexpected response format", llmData);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ TEST 1 FAILED Exception:", err.message);
    process.exit(1);
  }

  // TEST 2: Mock Vapi End-Of-Call Webhook (POST /api/vapi/webhook)
  console.log("▶️ TEST 2: Testing POST /api/vapi/webhook (End-Of-Call Lead Persistence)...");
  const testPhone = "+919876500111";
  const webhookPayload = {
    message: {
      type: "end-of-call-report",
      call: {
        id: "vapi-call-test-777",
        customer: {
          number: testPhone,
        },
        duration: 45,
      },
      durationSeconds: 45,
      artifact: {
        transcript: "User: Hi I want to buy a 2BHK flat in Edappally under 60 lakhs.\nAIRA: Perfect! I can assist you with 2BHK flats in Edappally.",
      },
      analysis: {
        summary: "Customer interested in buying 2BHK flat in Edappally under 60 lakhs",
      },
    },
  };

  try {
    const webhookRes = await fetch(`${baseUrl}/api/vapi/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    const webhookData = await webhookRes.json();
    console.log(`   HTTP Status: ${webhookRes.status}`);
    console.log(`   Response JSON:`, JSON.stringify(webhookData));

    // Fetch live leads list from server
    const leadsRes = await fetch(`${baseUrl}/api/leads`);
    const leadsList = await leadsRes.json();

    const createdLead = leadsList.find((l) => l.phone && l.phone.includes("9876500111"));
    if (webhookRes.status === 200 && webhookData.ok && createdLead) {
      console.log(`   Lead Verified in DB via API: ID = ${createdLead.id}, Phone = ${createdLead.phone}`);
      console.log(`   Requirement Saved: "${createdLead.requirement}"`);
      console.log("✅ TEST 2 PASSED: Vapi end-of-call-report correctly creates lead in CRM database!\n");
    } else {
      console.error("❌ TEST 2 FAILED: Lead was not found in CRM database after webhook hit.");
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ TEST 2 FAILED Exception:", err.message);
    process.exit(1);
  }

  console.log("=======================================================");
  console.log("🎉 ALL VAPI INTEGRATION TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

runVapiTests();
