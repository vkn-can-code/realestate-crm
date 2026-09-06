import crypto from "crypto";

/**
 * Generates a stable deduplication hash for an observed competitor property listing.
 * Combines address, city, state, zip code, bedrooms, and competitor ID.
 */
export function generateDedupHash(listing) {
  const normAddress = (listing.address || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normCity = (listing.city || "").toLowerCase().trim();
  const normState = (listing.state || "").toLowerCase().trim();
  const normZip = (listing.zipCode || "").trim();
  const beds = listing.bedrooms || 0;

  const rawKey = `${listing.competitorId || "COMP"}_${normAddress}_${normCity}_${normState}_${normZip}_${beds}`;
  return crypto.createHash("md5").update(rawKey).digest("hex");
}

/**
 * Calculates deduplication confidence score (0.0 to 1.0)
 */
export function calculateDedupConfidence(listing) {
  let score = 0.50; // base score

  if (listing.externalPropertyId) score += 0.25;
  if (listing.address && listing.zipCode) score += 0.15;
  if (listing.askingPrice && listing.squareFeet) score += 0.10;

  return Math.min(score, 0.99);
}

/**
 * Checks for existing observed listings in SQLite database by hash or address match
 */
export function findExistingListing(db, hash, address, zipCode) {
  try {
    const byHash = db.prepare("SELECT * FROM intelligence_observed_listings WHERE dedup_hash = ?").get(hash);
    if (byHash) return { match: byHash, matchType: "exact_hash", confidence: 0.99 };

    if (address && zipCode) {
      const byAddress = db
        .prepare("SELECT * FROM intelligence_observed_listings WHERE LOWER(address) = LOWER(?) AND zip_code = ?")
        .get(address, zipCode);
      if (byAddress) return { match: byAddress, matchType: "address_zip", confidence: 0.90 };
    }
  } catch (e) {
    console.warn("[Dedup Query Error]", e.message);
  }

  return { match: null, matchType: "none", confidence: 0.0 };
}
