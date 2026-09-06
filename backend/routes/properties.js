import { Router } from "express";
import { properties, newId, saveToDisk } from "../data/store.js";

const router = Router();

// GET /api/properties -> List all properties (supports ?listingIntent=buy/rent_in/sell/rent_out)
router.get("/", (req, res) => {
  const { listingIntent, approvalStatus } = req.query;
  let filtered = [...properties];
  if (listingIntent) {
    filtered = filtered.filter((p) => p.listingIntent === listingIntent);
  }
  if (approvalStatus) {
    filtered = filtered.filter((p) => p.approvalStatus === approvalStatus);
  }
  res.json(filtered);
});

router.get("/:id", (req, res) => {
  const property = properties.find((p) => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: "Property not found" });
  res.json(property);
});

// Admin uploads a new agency property listing (Supports up to 6 photo URLs & listingIntent)
router.post("/", (req, res) => {
  const { title, location, price, type, bedrooms, bathrooms, area, description, images, listingIntent } = req.body;

  let imgArray = Array.isArray(images) ? images.filter(Boolean).slice(0, 6) : [];

  const property = {
    id: newId("PROP"),
    title: title || "New Property Listing",
    location: location || "Kochi",
    price: Number(price) || 0,
    type: type || "Apartment",
    bedrooms: Number(bedrooms) || 2,
    bathrooms: Number(bathrooms) || 2,
    area: area || "1200 sqft",
    description: description || "",
    images: imgArray,
    status: "Available",
    listingIntent: listingIntent || "to_sell", // "to_sell" | "to_rent" | "client_buy" | "client_rent"
    approvalStatus: "Approved",
    createdAt: new Date().toISOString(),
  };
  properties.unshift(property);
  saveToDisk();
  res.status(201).json(property);
});

// Client submits property to Sell or Rent Out (Automatic DB Ingestion via AI Chat / Web form)
router.post("/submit-client-property", (req, res) => {
  const {
    title,
    location,
    price, // Expected price or monthly rent
    type, // Apartment, Villa, Commercial
    bedrooms,
    area,
    description,
    images,
    listingIntent, // "sell" or "rent_out"
    clientName,
    clientPhone,
    clientEmail,
    securityDeposit,
    channel,
  } = req.body;

  const intent = listingIntent === "rent_out" ? "rent_out" : "sell";

  const property = {
    id: newId("PROP"),
    title: title || `${type || "Property"} in ${location || "Kochi"} (Client Listing)`,
    location: location || "Kochi",
    price: Number(price) || 0,
    type: type || "Apartment",
    bedrooms: Number(bedrooms) || 2,
    area: area || "Unspecified sqft",
    description: description || `Property submitted by client ${clientName || "Customer"} for ${intent === "sell" ? "sale" : "renting out"}.`,
    images: Array.isArray(images) ? images : [],
    status: "Pending_Approval",
    listingIntent: intent,
    approvalStatus: "Pending",
    clientSubmission: {
      clientName: clientName || "Customer",
      clientPhone: clientPhone || "Unspecified",
      clientEmail: clientEmail || null,
      askingPrice: intent === "sell" ? `₹${price}` : null,
      expectedRent: intent === "rent_out" ? `₹${price} / mo` : null,
      securityDeposit: securityDeposit || null,
      channel: channel || "telegram",
      submittedAt: new Date().toISOString(),
    },
  };

  properties.unshift(property);
  saveToDisk();
  res.status(201).json({
    message: `Property successfully submitted for ${intent === "sell" ? "sale" : "rent out"}! Pending admin review.`,
    property,
  });
});

// Approve or reject client property submission
router.patch("/:id/approve", (req, res) => {
  const property = properties.find((p) => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: "Property not found" });

  const { status, approvalStatus } = req.body; // status: "Available" / "Rejected", approvalStatus: "Approved" / "Rejected"
  property.approvalStatus = approvalStatus || "Approved";
  property.status = status || "Available";
  saveToDisk();

  res.json({ message: "Property status updated", property });
});

router.put("/:id", (req, res) => {
  const idx = properties.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Property not found" });
  properties[idx] = { ...properties[idx], ...req.body };
  res.json(properties[idx]);
});

router.delete("/:id", (req, res) => {
  const idx = properties.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Property not found" });
  const [removed] = properties.splice(idx, 1);
  res.json(removed);
});

export default router;
