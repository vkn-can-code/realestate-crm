/**
 * Smart Apollo Integration & Candidate Discovery Service
 * Handles search parameter expansion, search modes, deduplication checks, and Apollo API execution.
 */

export function expandJobTitles(rawTitle = "") {
  if (!rawTitle) return ["Real Estate Agent", "Property Consultant", "Realtor"];

  // Split by slashes, commas, or 'or'
  const rawParts = String(rawTitle).split(/[\/,;]|\bor\b/i).map((t) => t.trim()).filter(Boolean);
  const titlesSet = new Set(rawParts);

  const standardVariations = [
    "Real Estate Agent",
    "Property Consultant",
    "Realtor",
    "Property Advisor",
    "Real Estate Sales Executive",
    "Real Estate Consultant",
    "Property Sales Consultant",
    "Business Development Executive - Real Estate",
    "Senior Real Estate Consultant",
    "Real Estate Broker",
  ];

  for (const part of rawParts) {
    const lower = part.toLowerCase();
    for (const v of standardVariations) {
      if (v.toLowerCase().includes(lower) || lower.includes("agent") || lower.includes("realtor") || lower.includes("consultant")) {
        titlesSet.add(v);
      }
    }
  }

  return Array.from(titlesSet);
}

export function expandLocations(rawLocation = "") {
  if (!rawLocation) return ["Miami, FL"];
  const parts = String(rawLocation).split(/[,;]/).map((l) => l.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [rawLocation];
}

export function isDuplicateProspect(db, candidate) {
  try {
    if (candidate.apolloId) {
      const byApolloId = db.prepare("SELECT id FROM recruitment_prospects WHERE apollo_id = ?").get(candidate.apolloId);
      if (byApolloId) return { isDuplicate: true, reason: `Apollo ID ${candidate.apolloId} already exists.` };
    }

    if (candidate.linkedinUrl && candidate.linkedinUrl.includes("linkedin.com")) {
      const byLinkedin = db.prepare("SELECT id FROM recruitment_prospects WHERE linkedin_url = ?").get(candidate.linkedinUrl);
      if (byLinkedin) return { isDuplicate: true, reason: `LinkedIn profile URL already imported.` };
    }

    if (candidate.fullName && candidate.companyName) {
      const normName = candidate.fullName.toLowerCase().trim();
      const normComp = candidate.companyName.toLowerCase().trim();
      const byNameComp = db.prepare(`
        SELECT id FROM recruitment_prospects 
        WHERE LOWER(full_name) = ? AND LOWER(company_name) = ?
      `).get(normName, normComp);

      if (byNameComp) return { isDuplicate: true, reason: `Candidate '${candidate.fullName}' at '${candidate.companyName}' already exists.` };
    }
  } catch (e) {
    console.warn("[Dedup Check Note]", e.message);
  }

  return { isDuplicate: false, reason: null };
}

export class ApolloService {
  constructor() {
    this.apiKey = process.env.APOLLO_API_KEY || null;
    this.baseUrl = "https://api.apollo.io/v1";
  }

  /**
   * Search candidate profiles on Apollo with smart title expansion and search modes.
   */
  async searchPeople({ rawTitles = "", rawLocations = "", qKeywords = "", targetCompanies = [], searchMode = "include_other_matching", page = 1, perPage = 20 }) {
    const personTitles = expandJobTitles(rawTitles);
    const personLocations = expandLocations(rawLocations);
    const companies = searchMode === "broad_talent_search" ? [] : targetCompanies.filter(Boolean);

    console.log(`[Apollo Service] Smart Search Execution:`, {
      personTitles,
      personLocations,
      companies,
      searchMode,
      hasApiKey: !!this.apiKey,
    });

    if (this.apiKey) {
      try {
        const response = await fetch(`${this.baseUrl}/people/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Api-Key": this.apiKey
          },
          body: JSON.stringify({
            person_titles: personTitles,
            person_locations: personLocations,
            q_keywords: qKeywords || undefined,
            organization_names: companies.length > 0 ? companies : undefined,
            page,
            per_page: perPage,
          }),
        });

        if (!response.ok) {
          // Safely parse error body — may be empty or non-JSON
          let errMsg = `Apollo HTTP ${response.status}`;
          try {
            const ct = response.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
              const errorData = await response.json();
              errMsg = errorData.error || errorData.message || errMsg;
            }
          } catch (_) {}
          throw new Error(errMsg);
        }

        // Safely parse success body
        let data = {};
        try {
          const text = await response.text();
          if (text && text.trim()) data = JSON.parse(text);
        } catch (_) {
          throw new Error("Apollo returned invalid JSON response");
        }

        const people = (data.people || []).map((p) => this.formatApolloPerson(p));
        if (people.length > 0) {
          return {
            people,
            pagination: data.pagination || { page, perPage, totalPages: 1, totalEntries: people.length },
            isSimulated: false,
            searchCriteriaUsed: { personTitles, personLocations, companies, searchMode },
          };
        }
      } catch (err) {
        console.warn(`[Apollo API Note] ${err.message}. Using simulated candidates.`);
      }
    }

    // Fallback Simulated Discovery Generator using actual search input location & titles
    const simulatedPeople = this.generateDynamicCandidates(personTitles, personLocations, searchMode, perPage);
    return {
      people: simulatedPeople,
      pagination: { page, perPage, totalPages: 1, totalEntries: simulatedPeople.length },
      isSimulated: true, // Force to true if we hit the fallback block
      searchCriteriaUsed: { personTitles, personLocations, companies, searchMode },
    };
  }

  formatApolloPerson(raw) {
    return {
      apolloId: raw.id || `APOLLO-${Math.random().toString(36).substr(2, 9)}`,
      fullName: raw.name || `${raw.first_name || "Agent"} ${raw.last_name || "Prospect"}`,
      firstName: raw.first_name || "Agent",
      lastName: raw.last_name || "Prospect",
      jobTitle: raw.title || "Real Estate Consultant",
      companyName: raw.organization_name || raw.company_name || "Premier Real Estate Group",
      location: `${raw.city || raw.state || "Target City"}, ${raw.country || "India"}`,
      linkedinUrl: raw.linkedin_url || `https://linkedin.com/in/${(raw.name || 'realtor').toLowerCase().replace(/\s+/g, '-')}`,
      experienceYears: raw.employment_history?.length ? raw.employment_history.length * 2 : 4,
    };
  }

  generateDynamicCandidates(titles, locations, searchMode, count = 10) {
    const loc = locations[0] || "Kochi, Kerala, India";
    const primaryTitle = titles[0] || "Property Consultant";

    const kochiKeywords = ["kochi", "kerala", "india", "panampally", "kakkanad", "edappally", "aluva", "maradu", "vytilla", "ernakulam", "thrissur", "trivandrum"];
    const isKochi = kochiKeywords.some(kw => loc.toLowerCase().includes(kw));

    const indianNames = [
      { first: "Rahul", last: "Menon", company: "Skyline Builders & Realty" },
      { first: "Anjali", last: "Nair", company: "Asset Homes Real Estate" },
      { first: "Vishnu", last: "Pillai", company: "Puravankara Properties" },
      { first: "Priya", last: "Varma", company: "Sobha Realty Kerala" },
      { first: "Arjun", last: "Kaimal", company: "SI Property Consultants" },
      { first: "Deepa", last: "Kurup", company: "DLF Cybercity Properties" },
      { first: "Feroz", last: "Khan", company: "Abad Builders & Advisory" },
      { first: "Neetha", last: "Thomas", company: "Confident Group Real Estate" },
    ];

    const usNames = [
      { first: "Marcus", last: "Vance", company: "Coldwell Banker Realty" },
      { first: "Sophia", last: "Rodriguez", company: "Compass Real Estate" },
      { first: "David", last: "Sterling", company: "BHHS EWM Realty" },
      { first: "Jessica", last: "Lin", company: "One Sotheby's Realty" },
      { first: "Carlos", last: "Mendez", company: "RE/MAX Premier" },
    ];

    const pool = isKochi ? indianNames : usNames;
    const candidates = [];

    for (let i = 0; i < count; i++) {
      const p = pool[i % pool.length];
      const titleVar = titles[i % titles.length] || primaryTitle;
      candidates.push({
        apolloId: `APO-${isKochi ? 'KCH' : 'MIA'}-${800 + i}`,
        fullName: `${p.first} ${p.last}`,
        firstName: p.first,
        lastName: p.last,
        jobTitle: titleVar,
        companyName: p.company,
        location: loc,
        linkedinUrl: `https://linkedin.com/in/${p.first.toLowerCase()}-${p.last.toLowerCase()}-realty`,
        experienceYears: 3 + (i % 6),
      });
    }

    return candidates;
  }
}
