import { Router } from "express";
import db, { newUuid } from "../data/db.js";
import { properties as internalProperties, newId } from "../data/store.js";
import { FirecrawlProvider } from "../services/intelligence/providers/firecrawlProvider.js";
import { findExistingListing, generateDedupHash } from "../services/intelligence/deduplication.js";
import { detectAndRecordChanges } from "../services/intelligence/changeDetection.js";
import { generateMarketAIInsights } from "../services/intelligence/aiInsightsService.js";

const router = Router();
const firecrawlProvider = new FirecrawlProvider();

// Seed initial US Market & Competitor Data if database is clean
function seedInitialIntelligenceData() {
  try {
    const compCount = db.prepare("SELECT COUNT(*) as count FROM intelligence_competitors").get();
    if (compCount.count === 0) {
      db.prepare(`
        INSERT INTO intelligence_competitors (id, name, brokerage_type, website, logo, headquarters, is_active, crawl_frequency, max_pages, include_patterns, exclude_patterns, notes)
        VALUES 
        ('COMP-101', 'MagicBricks Kerala', 'National Portal', 'https://www.magicbricks.com/property-for-sale/residential-real-estate/cochin', '', 'Mumbai, MH', 1, 'weekly', 30, '/property-for-sale,/flats-for-sale', '/login,/contact', 'Major property portal listings in Kochi'),
        ('COMP-102', ' 99Acres Kochi', 'National Portal', 'https://www.99acres.com/property-for-sale-in-kochi-ffid', '', 'Noida, UP', 1, 'weekly', 30, '/property-for-sale,/flats-for-sale', '/login,/contact', 'Large property portal with Kochi listings'),
        ('COMP-103', 'Skyline Builders Kochi', 'Regional Developer', 'https://www.skylinebuilders.in', '', 'Kochi, Kerala', 1, 'weekly', 20, '/projects,/apartments', '/contact,/careers', 'Major builder in Kakkanad and Aluva'),
        ('COMP-104', 'Asset Homes Kerala', 'Regional Developer', 'https://assethomes.in', '', 'Kochi, Kerala', 1, 'weekly', 20, '/projects,/property', '/contact,/gallery', 'Premium apartment builder in Kochi'),
        ('COMP-105', 'NoBroker Kochi', 'National Portal', 'https://www.nobroker.in/property/rent/kochi', '', 'Bengaluru, KA', 1, 'weekly', 25, '/property/buy,/property/rent', '/login,/register', 'Zero brokerage listings in Kochi')
      `).run();

      db.prepare(`
        INSERT INTO intelligence_markets (id, country, state, city, county, zip_code, neighborhood, property_types, price_segments)
        VALUES 
        ('MKT-KKD-682030', 'India', 'Kerala', 'Kochi', 'Ernakulam', '682030', 'Kakkanad / SmartCity', 'Apartment, Villa, Plot', '40L-80L, 80L-1.5Cr'),
        ('MKT-ALV-683101', 'India', 'Kerala', 'Kochi', 'Ernakulam', '683101', 'Aluva', 'Villa, Apartment', '60L-1.2Cr, 1.2Cr-2.5Cr'),
        ('MKT-EDP-682024', 'India', 'Kerala', 'Kochi', 'Ernakulam', '682024', 'Edappally / Lulu Area', 'Apartment, Commercial', '50L-1Cr, 1Cr-2Cr')
      `).run();

      console.log("[Market Intelligence] Seeded Kochi/Kerala Competitor & Market Data!");
    }
  } catch (e) {
    console.warn("[Intelligence Seed Note]", e.message);
  }
}


seedInitialIntelligenceData();

// 1. COMPETITORS MANAGEMENT API
router.get("/competitors", (req, res) => {
  try {
    const list = db.prepare("SELECT * FROM intelligence_competitors ORDER BY created_at DESC").all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/competitors", (req, res) => {
  const { name, brokerageType, website, headquarters, crawlFrequency, maxPages, includePatterns, excludePatterns, notes } = req.body;

  if (!name || !website) {
    return res.status(400).json({ error: "Competitor Name and Website URL are required." });
  }

  const id = `COMP-${newUuid().slice(0, 8)}`;
  try {
    db.prepare(`
      INSERT INTO intelligence_competitors (id, name, brokerage_type, website, headquarters, crawl_frequency, max_pages, include_patterns, exclude_patterns, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      brokerageType || "Boutique Brokerage",
      website,
      headquarters || "Austin, TX",
      crawlFrequency || "weekly",
      maxPages || 50,
      includePatterns || "/properties,/listings",
      excludePatterns || "/blog,/careers,/privacy",
      notes || ""
    );

    const created = db.prepare("SELECT * FROM intelligence_competitors WHERE id = ?").get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/competitors/:id", (req, res) => {
  const { id } = req.params;
  const { name, brokerageType, website, headquarters, crawlFrequency, maxPages, includePatterns, excludePatterns, notes, isActive } = req.body;

  try {
    db.prepare(`
      UPDATE intelligence_competitors 
      SET name = ?, brokerage_type = ?, website = ?, headquarters = ?, crawl_frequency = ?, max_pages = ?, include_patterns = ?, exclude_patterns = ?, notes = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, brokerageType, website, headquarters, crawlFrequency, maxPages, includePatterns, excludePatterns, notes, isActive ? 1 : 0, id);

    const updated = db.prepare("SELECT * FROM intelligence_competitors WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/competitors/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM intelligence_competitors WHERE id = ?").run(id);
    res.json({ ok: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. MARKETS CONFIGURATION API
router.get("/markets", (req, res) => {
  try {
    const list = db.prepare("SELECT * FROM intelligence_markets ORDER BY created_at DESC").all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/markets", (req, res) => {
  const { country, state, city, county, zipCode, neighborhood, propertyTypes, priceSegments } = req.body;

  if (!state || !city || !zipCode) {
    return res.status(400).json({ error: "State, City, and ZIP Code are required." });
  }

  const id = `MKT-${newUuid().slice(0, 8)}`;
  try {
    db.prepare(`
      INSERT INTO intelligence_markets (id, country, state, city, county, zip_code, neighborhood, property_types, price_segments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      country || "United States",
      state,
      city,
      county || "",
      zipCode,
      neighborhood || "",
      propertyTypes || "Single Family, Condominium",
      priceSegments || "$500K-$750K"
    );

    const created = db.prepare("SELECT * FROM intelligence_markets WHERE id = ?").get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/markets/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM intelligence_markets WHERE id = ?").run(id);
    res.json({ ok: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ASYNCHRONOUS DATA COLLECTION SCAN ENGINE
router.post("/competitors/:id/scan", async (req, res) => {
  const { id } = req.params;
  const competitor = db.prepare("SELECT * FROM intelligence_competitors WHERE id = ?").get(id);

  if (!competitor) {
    return res.status(404).json({ error: "Competitor not found." });
  }

  const jobId = `JOB-${newUuid().slice(0, 8)}`;
  const nowStr = new Date().toISOString();

  db.prepare(`
    INSERT INTO intelligence_scan_jobs (id, competitor_id, provider, status, started_at)
    VALUES (?, ?, 'native_puppeteer', 'running', ?)
  `).run(jobId, id, nowStr);

  res.json({ ok: true, jobId, message: `Scan job ${jobId} initiated for ${competitor.name}.` });

  // Execute scan asynchronously in background
  (async () => {
    try {
      const includePatterns = (competitor.include_patterns || "").split(",").map((p) => p.trim()).filter(Boolean);
      const excludePatterns = (competitor.exclude_patterns || "").split(",").map((p) => p.trim()).filter(Boolean);

      const urls = await firecrawlProvider.discoverUrls({
        website: competitor.website,
        includePatterns,
        excludePatterns,
        maxPages: competitor.max_pages || 50,
      });

      const extracted = await firecrawlProvider.collectAndExtractListings(urls, competitor);

      let newListingsCount = 0;
      let changesDetectedCount = 0;

      for (const item of extracted) {
        const hash = generateDedupHash(item);
        const matchResult = findExistingListing(db, hash, item.address, item.zipCode);

        if (matchResult.match) {
          // Detect changes against snapshot history
          const events = detectAndRecordChanges(db, matchResult.match, item, competitor.id);
          changesDetectedCount += events.length;

          // Update last seen
          db.prepare(`
            UPDATE intelligence_observed_listings 
            SET last_seen_at = CURRENT_TIMESTAMP, asking_price = ?, listing_status = ?
            WHERE id = ?
          `).run(item.askingPrice, item.listingStatus, matchResult.match.id);
        } else {
          // Insert new observed listing
          const obsId = `OBS-${newUuid().slice(0, 8)}`;
          db.prepare(`
            INSERT INTO intelligence_observed_listings (id, competitor_id, external_property_id, source_name, source_url, property_title, property_type, bedrooms, bathrooms, square_feet, lot_size, year_built, address, city, state, zip_code, neighborhood, asking_price, price_currency, price_per_sqft, listing_status, agent_name, brokerage_name, dedup_hash, confidence_score, raw_data_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            obsId,
            competitor.id,
            item.externalPropertyId,
            item.sourceName,
            item.sourceUrl,
            item.propertyTitle,
            item.propertyType,
            item.bedrooms,
            item.bathrooms,
            item.squareFeet,
            item.lotSize,
            item.yearBuilt,
            item.address,
            item.city,
            item.state,
            item.zipCode,
            item.neighborhood,
            item.askingPrice,
            item.priceCurrency,
            item.pricePerSqft,
            item.listingStatus,
            item.agentName,
            item.brokerageName,
            hash,
            item.confidenceScore || 0.95,
            JSON.stringify(item)
          );

          // Log NEW_LISTING event
          db.prepare(`
            INSERT INTO intelligence_change_events (id, observed_listing_id, competitor_id, change_type, previous_value, new_value, numeric_difference, percentage_change, detected_at)
            VALUES (?, ?, ?, 'NEW_LISTING', 'None', ?, ?, 0, ?)
          `).run(`CHG-${newUuid().slice(0, 8)}`, obsId, competitor.id, `$${item.askingPrice ? item.askingPrice.toLocaleString() : 'N/A'}`, item.askingPrice || 0, nowStr);

          newListingsCount++;
        }
      }

      db.prepare(`
        UPDATE intelligence_scan_jobs
        SET status = 'completed', pages_discovered = ?, pages_scraped = ?, listings_extracted = ?, completed_at = CURRENT_TIMESTAMP, log_output = ?
        WHERE id = ?
      `).run(
        urls.length,
        urls.length,
        extracted.length,
        `Scan completed. Discovered ${urls.length} pages, extracted ${extracted.length} listings. ${newListingsCount} new listings added, ${changesDetectedCount} price/status changes detected.`,
        jobId
      );
    } catch (scanErr) {
      console.error(`[Scan Job Failed: ${jobId}]`, scanErr.message);
      db.prepare(`
        UPDATE intelligence_scan_jobs
        SET status = 'failed', errors_count = 1, completed_at = CURRENT_TIMESTAMP, log_output = ?
        WHERE id = ?
      `).run(`Scan failed: ${scanErr.message}`, jobId);
    }
  })();
});

router.get("/scan-jobs", (req, res) => {
  try {
    const list = db.prepare(`
      SELECT j.*, c.name as competitor_name 
      FROM intelligence_scan_jobs j
      JOIN intelligence_competitors c ON j.competitor_id = c.id
      ORDER BY j.created_at DESC
      LIMIT 20
    `).all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. OBSERVED COMPETITOR LISTINGS API
router.get("/listings", (req, res) => {
  const { competitorId, zipCode, city, minPrice, maxPrice } = req.query;

  try {
    let query = "SELECT l.*, c.name as competitor_name FROM intelligence_observed_listings l JOIN intelligence_competitors c ON l.competitor_id = c.id WHERE 1=1";
    const params = [];

    if (competitorId && competitorId !== "all") {
      query += " AND l.competitor_id = ?";
      params.push(competitorId);
    }
    if (zipCode && zipCode !== "all") {
      query += " AND l.zip_code = ?";
      params.push(zipCode);
    }
    if (city && city !== "all") {
      query += " AND l.city LIKE ?";
      params.push(`%${city}%`);
    }

    query += " ORDER BY l.last_seen_at DESC LIMIT 100";

    const listings = db.prepare(query).all(params);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. CHANGE DETECTION FEED API
router.get("/changes", (req, res) => {
  try {
    const changes = db.prepare(`
      SELECT e.*, l.property_title, l.address, l.zip_code, c.name as competitor_name
      FROM intelligence_change_events e
      JOIN intelligence_observed_listings l ON e.observed_listing_id = l.id
      JOIN intelligence_competitors c ON e.competitor_id = c.id
      ORDER BY e.detected_at DESC
      LIMIT 50
    `).all();
    res.json(changes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. MARKET ANALYTICS & COMPARISON API
router.get("/analytics", (req, res) => {
  try {
    const competitors = db.prepare("SELECT * FROM intelligence_competitors").all();
    const observedListings = db.prepare("SELECT * FROM intelligence_observed_listings").all();
    const changeEvents = db.prepare("SELECT * FROM intelligence_change_events").all();

    // Compute Activity Scores per competitor
    const competitorActivityScores = competitors.map((c) => {
      const compListings = observedListings.filter((l) => l.competitor_id === c.id);
      const compChanges = changeEvents.filter((e) => e.competitor_id === c.id);
      const newCount = compChanges.filter((e) => e.change_type === "NEW_LISTING").length;
      const priceChanges = compChanges.filter((e) => e.change_type === "PRICE_REDUCTION" || e.change_type === "PRICE_INCREASE").length;

      // Activity Score formula
      const score = Math.min(100, compListings.length * 5 + newCount * 10 + priceChanges * 8);

      return {
        competitorId: c.id,
        competitorName: c.name,
        brokerageType: c.brokerage_type,
        website: c.website,
        totalObserved: compListings.length,
        newListingsThisWeek: newCount,
        priceChangesCount: priceChanges,
        activityScore: score,
        scoreBreakdown: `Score = (${compListings.length} listings × 5) + (${newCount} new × 10) + (${priceChanges} price changes × 8)`,
      };
    });

    // Compute Average Asking Prices by ZIP Code
    const zipStats = {};
    observedListings.forEach((l) => {
      const z = l.zip_code || "78704";
      if (!zipStats[z]) {
        zipStats[z] = { count: 0, totalPrice: 0, prices: [] };
      }
      zipStats[z].count += 1;
      if (l.asking_price) {
        zipStats[z].totalPrice += l.asking_price;
        zipStats[z].prices.push(l.asking_price);
      }
    });

    const zipAnalytics = Object.keys(zipStats).map((z) => {
      const avg = zipStats[z].totalPrice / (zipStats[z].prices.length || 1);
      return {
        zipCode: z,
        observedListingsCount: zipStats[z].count,
        averageAskingPrice: Math.round(avg),
        formattedAvgPrice: `$${Math.round(avg).toLocaleString()}`,
      };
    });

    // Comparison: Internal Inventory vs Observed Market Inventory
    const internalCount = internalProperties.length;
    const internalPrices = internalProperties.map((p) => p.price).filter(Boolean);
    const internalAvgPrice = internalPrices.length > 0 ? Math.round(internalPrices.reduce((a, b) => a + b, 0) / internalPrices.length) : 0;

    const observedPrices = observedListings.map((l) => l.asking_price).filter(Boolean);
    const observedAvgPrice = observedPrices.length > 0 ? Math.round(observedPrices.reduce((a, b) => a + b, 0) / observedPrices.length) : 0;

    res.json({
      summaryCards: {
        totalObservedListings: observedListings.length,
        newListingsThisPeriod: changeEvents.filter((e) => e.change_type === "NEW_LISTING").length,
        priceReductionsThisPeriod: changeEvents.filter((e) => e.change_type === "PRICE_REDUCTION").length,
        mostActiveCompetitor: competitorActivityScores.sort((a, b) => b.activityScore - a.activityScore)[0]?.competitorName || "ABC Realty",
        mostActiveZipCode: zipAnalytics.sort((a, b) => b.observedListingsCount - a.observedListingsCount)[0]?.zipCode || "78704",
      },
      competitorActivityScores,
      zipAnalytics,
      companyVsMarket: {
        internalInventoryCount: internalCount,
        observedMarketCount: observedListings.length,
        internalAvgAskingPrice: internalAvgPrice,
        observedAvgAskingPrice: observedAvgPrice,
        formattedInternalAvg: `$${internalAvgPrice.toLocaleString()}`,
        formattedObservedAvg: `$${observedAvgPrice.toLocaleString()}`,
        positioningNote: "Observed public competitor data compared with internal brokerage listings.",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. AI MARKET INSIGHTS API
router.get("/insights", async (req, res) => {
  try {
    const competitors = db.prepare("SELECT * FROM intelligence_competitors").all();
    const listings = db.prepare("SELECT * FROM intelligence_observed_listings").all();
    const changeEvents = db.prepare("SELECT * FROM intelligence_change_events").all();
    const markets = db.prepare("SELECT * FROM intelligence_markets").all();

    const insights = await generateMarketAIInsights({
      competitors,
      listings,
      changeEvents,
      markets,
      internalInventory: internalProperties,
    });

    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. WEEKLY MARKET REPORT API
router.get("/report", async (req, res) => {
  try {
    const competitors = db.prepare("SELECT * FROM intelligence_competitors").all();
    const listings = db.prepare("SELECT * FROM intelligence_observed_listings").all();
    const changeEvents = db.prepare("SELECT * FROM intelligence_change_events").all();
    const markets = db.prepare("SELECT * FROM intelligence_markets").all();

    const insights = await generateMarketAIInsights({
      competitors,
      listings,
      changeEvents,
      markets,
      internalInventory: internalProperties,
    });

    const report = {
      reportId: `RPT-${newUuid().slice(0, 8)}`,
      title: "Weekly Real Estate Market & Competitor Intelligence Briefing",
      generatedAt: new Date().toISOString(),
      coveredPeriod: "Past 7 Days",
      targetMarkets: markets.map((m) => `${m.city}, ${m.state} (ZIP ${m.zip_code})`),
      totalObservedListings: listings.length,
      newCompetitorListings: changeEvents.filter((c) => c.change_type === "NEW_LISTING").length,
      priceReductionsObserved: changeEvents.filter((c) => c.change_type === "PRICE_REDUCTION").length,
      executiveSummary: insights.summaryText,
      disclaimer: "DISCLAIMER: This report is based on public web observations collected via Firecrawl MVP data provider. It does not represent guaranteed MLS valuation or official title registry records.",
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. ALERTS API
router.get("/alerts", (req, res) => {
  try {
    const alerts = db.prepare("SELECT * FROM intelligence_alerts ORDER BY created_at DESC LIMIT 30").all();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/alerts/read", (req, res) => {
  try {
    db.prepare("UPDATE intelligence_alerts SET is_read = 1").run();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
