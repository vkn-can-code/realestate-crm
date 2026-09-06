import { searchGenericWeb } from "../agentReachService.js";

async function callGeminiFlash(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } else {
      const errorText = await res.text();
      console.error(`[Gemini API Error] Status: ${res.status}, Response: ${errorText}`);
    }
  } catch (err) {
    console.warn("[Gemini API Note]", err.message);
  }
  return null;
}

export class ApifyService {
  constructor() {
    this.apiToken = null; // Deprecated Apify Token
  }

  async searchPeople({ rawTitles = "", rawLocations = "", qKeywords = "", targetCompanies = [], perPage = 20 }) {
    // Smart Template Engine for Search Queries
    const baseTitle = Array.isArray(rawTitles) ? rawTitles[0] : (String(rawTitles).split(/[\/,;]/)[0] || "Real Estate Agent");
    const primaryCompany = targetCompanies.length > 0 ? targetCompanies[0] : null;
    const kw = qKeywords ? String(qKeywords).trim() : null;
    
    let queryStr = "";
    
    if (primaryCompany) {
      queryStr = `${baseTitle.trim()} at ${primaryCompany.trim()}`;
      if (kw) queryStr += ` ${kw}`;
    } else if (kw) {
      queryStr = `${baseTitle.trim()} specializing in ${kw}`;
    } else {
      queryStr = baseTitle.trim();
    }
    
    const locationStr = Array.isArray(rawLocations) ? rawLocations.join(", ") : (rawLocations || "Kochi");

    console.log(`[Agent-Reach Service] Triggering Scraper... Clean Query: "${queryStr}", Location: "${locationStr}"`);

    const requestedLimit = parseInt(perPage, 10) || 10;
    const safeLimit = Math.min(requestedLimit, 5);

    try {
      // Use semantic web search since Twitter requires cookies
      const searchQ = `category:people ${queryStr} ${locationStr} LinkedIn`;
      console.log(`[Agent-Reach Service] Executing Semantic Search for: ${searchQ}`);
      const rawOutput = await searchGenericWeb(searchQ);
      
      if (rawOutput && rawOutput.length > 0) {
        console.log(`[Agent-Reach Service] Successfully fetched ${rawOutput.length} bytes of data from Python CLI.`);
        
        // Parse the markdown output into JSON array of people
        const prompt = `
Extract a list of professional profiles from the following unstructured web search results.
Return ONLY a valid JSON array of objects, with no markdown code blocks or other text.
If no profiles are found, return an empty array [].

Schema for each object:
{
  "firstName": "String",
  "lastName": "String",
  "jobTitle": "String",
  "companyName": "String",
  "location": "String",
  "linkedinUrl": "String or null"
}

Search Results:
${rawOutput.substring(0, 8000)}
`;
        
        const jsonText = await callGeminiFlash(prompt);
        if (jsonText) {
          const cleanJson = jsonText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
          try {
            const parsedProfiles = JSON.parse(cleanJson);
            if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
              console.log(`[Agent-Reach Service] Gemini successfully parsed ${parsedProfiles.length} real profiles.`);
              
              const formattedPeople = parsedProfiles.map((p, i) => ({
                apolloId: `EXA-${Date.now()}-${i}`,
                fullName: `${p.firstName} ${p.lastName}`,
                firstName: p.firstName,
                lastName: p.lastName,
                jobTitle: p.jobTitle || baseTitle,
                companyName: p.companyName || "Unknown",
                location: p.location || locationStr,
                linkedinUrl: p.linkedinUrl,
                experienceYears: 3 + (i % 6), // Synthesized
                email: null,
                phone: null,
              }));

              return {
                people: formattedPeople.slice(0, safeLimit),
                pagination: { page: 1, perPage: safeLimit, totalPages: 1, totalEntries: formattedPeople.length },
                isSimulated: false,
                searchCriteriaUsed: { rawTitles, rawLocations },
              };
            }
          } catch (e) {
            console.warn("[Agent-Reach Service] Failed to parse JSON from Gemini:", e.message);
          }
        }
      } else {
        console.warn("[Agent-Reach Service] No results returned from CLI. Using simulated candidates.");
      }

    } catch (err) {
      console.warn(`[Agent-Reach Service Note] ${err.message}. Using simulated candidates.`);
    }

    // Graceful fallback — return simulated Kerala real estate agent data
    return this.generateSimulatedCandidates(rawTitles, rawLocations, perPage);
  }

  generateSimulatedCandidates(rawTitles, rawLocations, count = 10) {
    const loc = Array.isArray(rawLocations) ? rawLocations[0] : (rawLocations || "Kochi, Kerala");
    const title = Array.isArray(rawTitles) ? rawTitles[0] : (String(rawTitles).split(/[\/,;]/)[0] || "Real Estate Agent");

    const names = [
      ["Arjun", "Nair"], ["Priya", "Menon"], ["Rahul", "Pillai"], ["Sneha", "Kumar"],
      ["Vishnu", "Das"], ["Divya", "Krishnan"], ["Arun", "Mohan"], ["Anjali", "Raj"],
      ["Sreekanth", "P"], ["Meera", "Suresh"], ["Jithin", "George"], ["Reshma", "Varghese"],
    ];
    const companies = [
      "Skyline Builders", "Asset Homes", "Puravankara Kochi", "Sobha Limited",
      "Brigade Group Kerala", "Confident Group", "Mather & Platt Realty", "JLL India Kochi",
    ];

    return {
      people: names.slice(0, Math.min(count, names.length)).map(([first, last], i) => ({
        apolloId: `SIM-${Date.now()}-${i}`,
        fullName: `${first} ${last}`,
        firstName: first,
        lastName: last,
        jobTitle: title,
        companyName: companies[i % companies.length],
        location: loc,
        linkedinUrl: `https://linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-realestate`,
        experienceYears: 3 + (i % 6),
        email: null,
        phone: null,
      })),
      pagination: { page: 1, perPage: count, totalPages: 1, totalEntries: Math.min(count, names.length) },
      isSimulated: true,
      searchCriteriaUsed: { rawTitles, rawLocations },
    };
  }

  formatApifyPerson(raw, index) {
    const fullName = raw.name || raw.title || `Agent ${index}`;
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Agent";
    const lastName = nameParts.slice(1).join(" ") || "Prospect";

    return {
      apolloId: `APIFY-${raw.id || Math.random().toString(36).substr(2, 9)}`, // Keep key as apolloId for backward compatibility in the route
      fullName,
      firstName,
      lastName,
      jobTitle: raw.jobTitle || raw.role || "Real Estate Consultant",
      companyName: raw.company || raw.brokerage || "Premier Real Estate Group",
      location: raw.location || raw.address || "Target City",
      linkedinUrl: raw.url || raw.linkedin || `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(fullName)}`,
      experienceYears: 4, // Default as scraper doesn't usually provide this directly
      
      // We also store these if the scraper got them so enrichment can use them!
      email: raw.email || raw.emails?.[0] || null,
      phone: raw.phone || raw.phones?.[0] || null
    };
  }
}
