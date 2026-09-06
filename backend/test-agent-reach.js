import { searchGenericWeb, readWebpage, searchTwitter } from "./services/agentReachService.js";

async function runTests() {
  console.log("==========================================");
  console.log("🧪 Testing Agent-Reach Integration");
  console.log("==========================================\n");

  try {
    console.log("1. Testing Web Reader (Jina Reader via Agent Reach)....");
    // Read a simple, real-estate related webpage
    const pageText = await readWebpage("https://example.com");
    console.log(`✅ Success! Fetched ${pageText.length} characters.`);
    console.log("Snippet: ", pageText.substring(0, 150).replace(/\n/g, " ") + "...\n");
  } catch (e) {
    console.error("❌ Web Reader Failed:", e.message);
  }

  try {
    console.log("2. Testing Semantic Web Search (MCPorter + Exa)....");
    // This will fail gracefully if mcporter/exa isn't fully configured
    const searchResult = await searchGenericWeb("real estate kochi");
    console.log(`✅ Success! Search returned ${searchResult.length} characters.`);
    console.log("Snippet: ", searchResult.substring(0, 150).replace(/\n/g, " ") + "...\n");
  } catch (e) {
    console.error("❌ Web Search Failed:", e.message, "\n");
  }

  try {
    console.log("3. Testing Twitter Scraper....");
    // This will fail gracefully if cookies are missing
    const twitterResult = await searchTwitter("Real Estate Agent Kochi", 2);
    if (twitterResult && twitterResult.length > 0) {
      console.log(`✅ Success! Twitter returned data.`);
      console.log("Snippet: ", twitterResult.substring(0, 150).replace(/\n/g, " ") + "...\n");
    } else {
      console.log("⚠️ Twitter Search returned empty (likely due to missing cookies in .env).\n");
    }
  } catch (e) {
    console.error("❌ Twitter Search Failed:", e.message, "\n");
  }
}

runTests();
