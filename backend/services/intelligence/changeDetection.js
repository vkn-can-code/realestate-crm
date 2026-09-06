import { newUuid } from "../../data/db.js";

/**
 * Change Detection Engine for Competitor Market Intelligence.
 * Compares current scraped listing state against stored historical snapshots.
 */
export function detectAndRecordChanges(db, existingListing, newListingData, competitorId) {
  const changeEvents = [];
  const nowStr = new Date().toISOString();

  // 1. PRICE CHANGE DETECTION
  const oldPrice = Number(existingListing.asking_price || 0);
  const newPrice = Number(newListingData.askingPrice || 0);

  if (oldPrice > 0 && newPrice > 0 && oldPrice !== newPrice) {
    const numericDiff = newPrice - oldPrice;
    const pctChange = Number(((numericDiff / oldPrice) * 100).toFixed(2));
    const changeType = numericDiff < 0 ? "PRICE_REDUCTION" : "PRICE_INCREASE";

    const event = {
      id: `CHG-${newUuid().slice(0, 8)}`,
      observed_listing_id: existingListing.id,
      competitor_id: competitorId || existingListing.competitor_id,
      change_type: changeType,
      previous_value: `$${oldPrice.toLocaleString()}`,
      new_value: `$${newPrice.toLocaleString()}`,
      numeric_difference: numericDiff,
      percentage_change: pctChange,
      detected_at: nowStr,
    };

    changeEvents.push(event);

    try {
      db.prepare(`
        INSERT INTO intelligence_change_events (id, observed_listing_id, competitor_id, change_type, previous_value, new_value, numeric_difference, percentage_change, detected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.id,
        event.observed_listing_id,
        event.competitor_id,
        event.change_type,
        event.previous_value,
        event.new_value,
        event.numeric_difference,
        event.percentage_change,
        event.detected_at
      );

      // Create Alert for significant price reductions (>= 5%)
      if (changeType === "PRICE_REDUCTION" && Math.abs(pctChange) >= 5) {
        db.prepare(`
          INSERT INTO intelligence_alerts (id, title, alert_type, severity, message, is_read, created_at)
          VALUES (?, ?, ?, ?, ?, 0, ?)
        `).run(
          `ALT-${newUuid().slice(0, 8)}`,
          `Major Price Reduction Observed (${pctChange}%)`,
          "PRICE_REDUCTION",
          "warning",
          `Competitor reduced asking price for ${existingListing.address || existingListing.property_title} from $${oldPrice.toLocaleString()} to $${newPrice.toLocaleString()} (${pctChange}%).`,
          nowStr
        );
      }
    } catch (e) {
      console.warn("[Change Detection Insert Error]", e.message);
    }
  }

  // 2. STATUS CHANGE DETECTION
  const oldStatus = existingListing.listing_status || "Active";
  const newStatus = newListingData.listingStatus || "Active";

  if (oldStatus !== newStatus) {
    const event = {
      id: `CHG-${newUuid().slice(0, 8)}`,
      observed_listing_id: existingListing.id,
      competitor_id: competitorId || existingListing.competitor_id,
      change_type: "STATUS_CHANGE",
      previous_value: oldStatus,
      new_value: newStatus,
      numeric_difference: 0,
      percentage_change: 0,
      detected_at: nowStr,
    };

    changeEvents.push(event);

    try {
      db.prepare(`
        INSERT INTO intelligence_change_events (id, observed_listing_id, competitor_id, change_type, previous_value, new_value, numeric_difference, percentage_change, detected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.id,
        event.observed_listing_id,
        event.competitor_id,
        event.change_type,
        event.previous_value,
        event.new_value,
        event.numeric_difference,
        event.percentage_change,
        event.detected_at
      );
    } catch (e) {
      console.warn("[Status Change Insert Error]", e.message);
    }
  }

  // Record Snapshot
  try {
    db.prepare(`
      INSERT INTO intelligence_snapshots (id, observed_listing_id, asking_price, listing_status, raw_snapshot_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `SNP-${newUuid().slice(0, 8)}`,
      existingListing.id,
      newPrice,
      newStatus,
      JSON.stringify(newListingData),
      nowStr
    );
  } catch (e) {
    console.warn("[Snapshot Insert Error]", e.message);
  }

  return changeEvents;
}
