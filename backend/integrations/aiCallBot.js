import { properties as storeProperties } from "../data/store.js";

/** Extracts structured requirement from raw chat/call text. */
export async function extractRequirement({ transcriptOrMessage }) {
  const text = (transcriptOrMessage || "").toLowerCase();
  
  let service = "Buy";
  if (text.includes("sell")) service = "Sell";
  else if (text.includes("rent out") || text.includes("lease out")) service = "Rent Out";
  else if (text.includes("rent")) service = "Rent";

  let bedrooms = null;
  const bhkMatch = text.match(/(\d+)\s*bhk/i);
  if (bhkMatch) bedrooms = parseInt(bhkMatch[1], 10);

  return {
    service,
    bedrooms,
    raw: transcriptOrMessage,
  };
}

/** Matches a lead profile or requirement against available property inventory. */
export async function matchProperties({ requirement, properties }) {
  const targetList = properties || storeProperties;
  const reqText = typeof requirement === "string" ? requirement.toLowerCase() : JSON.stringify(requirement || "").toLowerCase();

  const matches = targetList.filter((prop) => {
    const titleMatch = reqText.includes(prop.type.toLowerCase()) || reqText.includes("house") || reqText.includes("apartment") || reqText.includes("villa");
    const locMatch = reqText.includes(prop.location.toLowerCase().split(",")[0]);
    const bhkMatch = reqText.includes(`${prop.bedrooms}bhk`) || reqText.includes(`${prop.bedrooms} bhk`);
    return titleMatch || locMatch || bhkMatch;
  });

  // Fallback to top 2 properties if specific keyword match is broad
  const results = matches.length > 0 ? matches : targetList.slice(0, 2);
  return results.map((p) => ({
    ...p,
    matchScore: matches.includes(p) ? 0.95 : 0.7,
  }));
}

export default { extractRequirement, matchProperties };
