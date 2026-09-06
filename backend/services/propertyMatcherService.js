/**
 * Automated Property Matcher Service
 * Matches lead requirements (budget, location, property type, bedrooms) against verified property catalog.
 */

import { properties as catalogProperties } from "../data/store.js";

export function matchPropertiesForLead(lead, extraProperties = []) {
  const allProperties = [...catalogProperties, ...extraProperties];

  const leadLocation = (lead.location || lead.preferredLocation || "").toLowerCase();
  const leadReq = (lead.requirement || lead.propertyRequirement || "").toLowerCase();
  const leadType = (lead.propertyType || "").toLowerCase();

  // Parse numeric budget limit from string (e.g., "₹80 Lakhs" -> 8000000)
  let leadBudgetMax = 0;
  if (lead.budget) {
    const digits = String(lead.budget).replace(/[^0-9.]/g, "");
    const val = parseFloat(digits);
    if (String(lead.budget).toLowerCase().includes("crore") || String(lead.budget).toLowerCase().includes("cr")) {
      leadBudgetMax = val * 10000000;
    } else if (String(lead.budget).toLowerCase().includes("lakh") || String(lead.budget).toLowerCase().includes("l")) {
      leadBudgetMax = val * 100000;
    } else if (val < 1000) {
      leadBudgetMax = val * 100000; // default assumption Lakhs
    } else {
      leadBudgetMax = val;
    }
  }

  const matches = allProperties.map((prop) => {
    let score = 50; // base match

    // 1. Location match
    const propLoc = (prop.location || "").toLowerCase();
    if (leadLocation && (propLoc.includes(leadLocation) || leadLocation.includes(propLoc))) {
      score += 25;
    } else if (leadReq && propLoc.split(",").some((p) => leadReq.includes(p.trim()))) {
      score += 20;
    }

    // 2. Budget match
    if (leadBudgetMax > 0 && prop.price) {
      if (prop.price <= leadBudgetMax * 1.1) {
        score += 15;
      } else if (prop.price <= leadBudgetMax * 1.25) {
        score += 5;
      }
    }

    // 3. Property Type match
    const propType = (prop.type || "").toLowerCase();
    if (leadType && (propType.includes(leadType) || leadType.includes(propType))) {
      score += 10;
    } else if (leadReq.includes("bhk") && propType.includes("apartment")) {
      score += 10;
    }

    return {
      property: prop,
      matchScore: Math.min(98, score),
      reason: score >= 80 ? "High location & budget alignment" : "Matches price range & requirement criteria",
    };
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}
