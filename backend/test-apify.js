import { ApifyClient } from 'apify-client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load from backend dir
dotenv.config({ path: '/Users/fao/Documents/realestate-crm/backend/.env' });

async function testApify() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error("No APIFY_API_TOKEN found in environment.");
    return;
  }

  console.log("Using API token:", token.substring(0, 10) + "...");
  const client = new ApifyClient({ token });

  try {
    const input = {
      "mode": "search",
      "query": "Real Estate Agent at Skyline Builders",
      "location": "Kochi, Kerala",
      "maxResults": 2,
      "requireEmail": false,
      "enableSmtpVerification": false,
      "smtpTimeout": 5
    };

    console.log("Calling Actor...");
    const run = await client.actor("4ScGryvxtqJmrucnf").call(input);
    console.log(`Run ${run.id} finished. Status: ${run.status}`);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Fetched ${items.length} items from dataset.`);

    items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`);
      console.log(`- Name: ${item.name || item.title}`);
      console.log(`- Role: ${item.jobTitle || item.role}`);
      console.log(`- Company: ${item.company || item.brokerage}`);
      console.log(`- Location: ${item.location || item.address}`);
    });
  } catch (error) {
    console.error("Apify error:", error.message);
  }
}

testApify();
