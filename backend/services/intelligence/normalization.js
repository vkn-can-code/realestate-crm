/**
 * Data Normalization Engine for Real Estate Market Intelligence
 * Handles varying competitor web formats ($750K, $750,000, 3 Bed, 3 BR, etc.)
 */

export function normalizePrice(rawPrice) {
  if (rawPrice === null || rawPrice === undefined) return null;
  if (typeof rawPrice === "number") return rawPrice;

  const str = String(rawPrice).trim().toUpperCase();

  // Match multiplier suffixes: $1.2M, $750K
  if (str.endsWith("M")) {
    const val = parseFloat(str.replace(/[^0-9.]/g, ""));
    return isNaN(val) ? null : val * 1000000;
  }
  if (str.endsWith("K")) {
    const val = parseFloat(str.replace(/[^0-9.]/g, ""));
    return isNaN(val) ? null : val * 1000;
  }

  // Remove non-numeric characters except digits & decimal points
  const clean = str.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? null : parsed;
}

export function normalizeBedrooms(rawBeds) {
  if (rawBeds === null || rawBeds === undefined) return null;
  if (typeof rawBeds === "number") return Math.round(rawBeds);

  const str = String(rawBeds).trim().toLowerCase();

  // Extract first sequence of digits
  const match = str.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  // Word numbers fallback
  if (str.includes("one") || str.includes("studio")) return 1;
  if (str.includes("two")) return 2;
  if (str.includes("three")) return 3;
  if (str.includes("four")) return 4;
  if (str.includes("five")) return 5;

  return null;
}

export function normalizeBathrooms(rawBaths) {
  if (rawBaths === null || rawBaths === undefined) return null;
  if (typeof rawBaths === "number") return rawBaths;

  const str = String(rawBaths).trim().toLowerCase();
  const match = str.match(/[\d.]+/);
  if (match) {
    const val = parseFloat(match[0]);
    return isNaN(val) ? null : val;
  }
  return null;
}

export function normalizeSquareFeet(rawSqft) {
  if (!rawSqft) return null;
  if (typeof rawSqft === "number") return Math.round(rawSqft);
  const clean = String(rawSqft).replace(/[^0-9]/g, "");
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? null : parsed;
}

export function normalizePropertyType(rawType) {
  if (!rawType) return "Single Family";
  const str = String(rawType).trim().toLowerCase();

  if (str.includes("single") || str.includes("house") || str.includes("home")) return "Single Family";
  if (str.includes("condo") || str.includes("condominium")) return "Condominium";
  if (str.includes("town") || str.includes("row")) return "Townhouse";
  if (str.includes("apartment") || str.includes("apt")) return "Apartment";
  if (str.includes("multi") || str.includes("duplex") || str.includes("triplex")) return "Multi-Family";
  if (str.includes("land") || str.includes("lot")) return "Land / Lot";
  if (str.includes("commercial") || str.includes("office") || str.includes("retail")) return "Commercial";

  return "Single Family";
}

export function normalizeZipCode(rawZip) {
  if (!rawZip) return "78704";
  const match = String(rawZip).match(/\b\d{5}\b/);
  return match ? match[0] : "78704";
}

export function normalizeListing(rawListing = {}) {
  const askingPrice = normalizePrice(rawListing.askingPrice || rawListing.price);
  const squareFeet = normalizeSquareFeet(rawListing.squareFeet || rawListing.sqft || rawListing.area);
  const pricePerSqft = askingPrice && squareFeet ? Math.round(askingPrice / squareFeet) : null;

  return {
    externalPropertyId: rawListing.externalPropertyId || rawListing.propertyId || null,
    sourceName: rawListing.sourceName || "Observed Public Web Data",
    sourceUrl: rawListing.sourceUrl || rawListing.url || "https://example.com/property",
    competitorId: rawListing.competitorId || "COMP-101",
    propertyTitle: rawListing.propertyTitle || rawListing.title || "Observed Competitor Listing",
    propertyType: normalizePropertyType(rawListing.propertyType || rawListing.type),
    propertySubType: rawListing.propertySubType || "Detached",
    bedrooms: normalizeBedrooms(rawListing.bedrooms || rawListing.beds || rawListing.bhk),
    bathrooms: normalizeBathrooms(rawListing.bathrooms || rawListing.baths),
    squareFeet,
    lotSize: rawListing.lotSize || "0.25 Acres",
    yearBuilt: rawListing.yearBuilt ? parseInt(rawListing.yearBuilt, 10) : 2021,
    address: rawListing.address || "100 Main St",
    city: rawListing.city || "Austin",
    state: rawListing.state || "TX",
    zipCode: normalizeZipCode(rawListing.zipCode || rawListing.zip),
    neighborhood: rawListing.neighborhood || "South Congress (78704)",
    askingPrice,
    priceCurrency: "USD",
    pricePerSqft,
    listingStatus: rawListing.listingStatus || "Active",
    agentName: rawListing.agentName || "Listing Agent",
    brokerageName: rawListing.brokerageName || "Competitor Brokerage",
    rawSourceReference: JSON.stringify(rawListing),
  };
}
