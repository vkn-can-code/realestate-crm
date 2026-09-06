import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROPOSALS_DIR = path.join(__dirname, "../public/proposals");

if (!fs.existsSync(PROPOSALS_DIR)) {
  fs.mkdirSync(PROPOSALS_DIR, { recursive: true });
}

function formatPrice(amount, intent) {
  if (!amount || isNaN(amount)) return "Price on Request";
  const num = Number(amount);
  const suffix = (intent === "to_rent" || intent === "rent_in" || intent === "client_rent") ? " / month" : "";
  if (num >= 10000000) {
    return `INR ${(num / 10000000).toFixed(2)} Crore${suffix}`;
  } else if (num >= 100000) {
    return `INR ${(num / 100000).toFixed(2)} Lakh${suffix}`;
  }
  return `INR ${num.toLocaleString("en-IN")}${suffix}`;
}

function formatIntentLabel(intent) {
  switch (intent) {
    case "to_rent":
    case "rent_in":
      return "FOR RENT";
    case "client_rent":
      return "CLIENT RENTING";
    case "client_buy":
      return "CLIENT BUYING";
    case "to_sell":
    case "buy":
    default:
      return "FOR SALE";
  }
}

export function generateProposalPdf({ proposalId, customerName, phone, requirement, properties = [] }) {
  return new Promise((resolve, reject) => {
    try {
      const filename = `proposal_${proposalId || Date.now()}.pdf`;
      const filePath = path.join(PROPOSALS_DIR, filename);
      const doc = new PDFDocument({ margin: 30, size: "A4" });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const totalProps = properties.length;
      const totalPages = Math.max(1, totalProps);

      // COVER / OVERVIEW SUMMARY SECTION IF NO MATCHES
      if (totalProps === 0) {
        doc.rect(0, 0, doc.page.width, 90).fill("#1A365D");
        doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold").text("REALTYPULSE REAL ESTATE AGENCY", 30, 25);
        doc.fontSize(10).font("Helvetica").text("Premium Residential & Commercial Properties | Kochi, Kerala", 30, 55);
        doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 400, 25, { align: "right" });

        doc.fillColor("#2D3748").fontSize(16).font("Helvetica-Bold").text("CUSTOM PROPERTY MATCH PROPOSAL", 30, 120);
        doc.fillColor("#718096").fontSize(11).font("Helvetica").text("No exact matching properties found right now. Our sales team will contact you shortly with fresh offline listings.", 30, 160);
      } else {
        // Dedicated Full Page for Each Matched Property
        properties.slice(0, 5).forEach((prop, index) => {
          if (index > 0) {
            doc.addPage();
          }

          // 1. BRANDING HEADER BAR
          doc.rect(0, 0, doc.page.width, 70).fill("#1A365D");
          doc.fillColor("#FFFFFF").fontSize(18).font("Helvetica-Bold").text("REALTYPULSE REAL ESTATE AGENCY", 30, 18);
          doc.fontSize(9).font("Helvetica").text("Premium Property Proposal Catalog", 30, 42);
          doc.text(`Page ${index + 1} of ${totalPages}`, 420, 20, { align: "right" });
          doc.text(`Proposal ID: ${proposalId}`, 420, 36, { align: "right" });

          // 2. PROPERTY TITLE & INTENT BADGE BAR
          doc.rect(30, 82, 535, 45).fillAndStroke("#EDF2F7", "#CBD5E0");

          const intentLabel = formatIntentLabel(prop.listingIntent);
          doc.rect(38, 90, 85, 28).fill(intentLabel.includes("RENT") ? "#D69E2E" : "#2B6CB0");
          doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold").text(intentLabel, 42, 98, { width: 77, align: "center" });

          doc.fillColor("#1A202C").fontSize(14).font("Helvetica-Bold").text(prop.title || prop.name || "Luxury Property Listing", 135, 96);
          doc.fillColor("#E53E3E").fontSize(13).font("Helvetica-Bold").text(formatPrice(prop.price, prop.listingIntent), 390, 96, { align: "right" });

          // 3. SPECIFICATIONS SUMMARY TABLE
          doc.rect(30, 137, 535, 65).fillAndStroke("#F7FAFC", "#E2E8F0");
          
          doc.fillColor("#4A5568").fontSize(9).font("Helvetica-Bold");
          doc.text("Location:", 42, 147);
          doc.font("Helvetica").text(prop.location || "Kakkanad, Kochi", 110, 147);

          doc.font("Helvetica-Bold").text("Type & BHK:", 300, 147);
          doc.font("Helvetica").text(`${prop.bedrooms || 3} BHK ${prop.type || "Apartment"} (${prop.bathrooms || 2} Baths)`, 380, 147);

          doc.font("Helvetica-Bold").text("Sqft Area:", 42, 167);
          doc.font("Helvetica").text(prop.area || "1450 sqft", 110, 167);

          doc.font("Helvetica-Bold").text("Possession:", 300, 167);
          doc.font("Helvetica").text(prop.possession || "Ready to Move In", 380, 167);

          // 4. 6-PHOTO SHOWCASE GRID (2 ROWS x 3 COLUMNS)
          doc.fillColor("#1A365D").fontSize(11).font("Helvetica-Bold").text("PROPERTY PHOTO GALLERY (UP TO 6 PHOTOS)", 30, 215);

          const photos = Array.isArray(prop.images) ? prop.images.filter(Boolean) : [];
          let gridY = 235;

          for (let pIdx = 0; pIdx < 6; pIdx++) {
            const col = pIdx % 3;
            const row = Math.floor(pIdx / 3);
            const boxX = 30 + col * 180;
            const boxY = gridY + row * 125;

            doc.rect(boxX, boxY, 172, 115).fillAndStroke("#FFFFFF", "#CBD5E0");
            doc.rect(boxX, boxY, 172, 22).fill("#EDF2F7");

            doc.fillColor("#2D3748").fontSize(9).font("Helvetica-Bold").text(`Photo #${pIdx + 1}`, boxX + 8, boxY + 6);

            if (photos[pIdx]) {
              doc.fillColor("#2B6CB0").fontSize(8).font("Helvetica").text("URL Reference:", boxX + 8, boxY + 30);
              const pUrl = String(photos[pIdx]);
              doc.fillColor("#4A5568").fontSize(7).font("Helvetica").text(pUrl.slice(0, 50), boxX + 8, boxY + 45, { width: 156, height: 60 });
            } else {
              doc.fillColor("#A0AEC0").fontSize(9).font("Helvetica-Bold").text("Photo Placeholder", boxX + 30, boxY + 55, { align: "center", width: 110 });
              doc.fontSize(7).font("Helvetica").text("Upload photo in CRM database", boxX + 20, boxY + 70, { align: "center", width: 130 });
            }
          }

          // 5. DESCRIPTION & AMENITIES BOX
          const descY = gridY + 260;
          doc.rect(30, descY, 535, 95).fillAndStroke("#F7FAFC", "#E2E8F0");
          doc.fillColor("#1A365D").fontSize(11).font("Helvetica-Bold").text("Property Description & Key Amenities", 42, descY + 10);
          
          doc.fillColor("#2D3748").fontSize(9).font("Helvetica").text(
            prop.description || "Prime location property featuring modern architectural design, 24/7 security, dedicated car parking, water connection, and fast access to Metro & Infopark.",
            42,
            descY + 28,
            { width: 510, height: 55 }
          );

          // 6. CONTACT CALL TO ACTION FOOTER
          const footerY = descY + 110;
          doc.rect(30, footerY, 535, 48).fill("#1A365D");
          doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold").text("Interested? Schedule a Private Site Visit or Consultation!", 40, footerY + 12, { align: "center" });
          doc.fontSize(8).font("Helvetica").text("Call / WhatsApp: +91 9633541720 | Email: info@realtypulse.in | Office: Kakkanad & MG Road, Kochi", 40, footerY + 30, { align: "center" });
        });
      }

      doc.end();

      stream.on("finish", () => {
        resolve({
          filename,
          filePath,
          pdfUrl: `/proposals/${filename}`,
        });
      });

      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}
