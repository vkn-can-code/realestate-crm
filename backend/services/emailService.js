import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.brevo.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || process.env.BREVO_SMTP_USER || "";
  const pass = process.env.SMTP_PASS || process.env.BREVO_SMTP_PASS || "";

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback dev transporter
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

export async function sendProposalEmail({ toEmail, customerName, proposalId, pdfUrl, properties = [] }) {
  if (!toEmail || !toEmail.includes("@")) {
    console.log(`[Email Dispatch Note] No valid recipient email provided ("${toEmail}"). Skipping email dispatch.`);
    return { ok: false, reason: "No valid recipient email provided" };
  }

  try {
    const transporter = getTransporter();

    const propertyCardsHtml = properties.slice(0, 5).map((p, idx) => `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: #1a202c; margin: 0; font-size: 16px;">#${idx + 1}. ${p.title || p.name || "Luxury Property"}</h3>
          <span style="background: #2b6cb0; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px;">₹${(p.price / 100000).toFixed(2)} Lakhs</span>
        </div>
        <p style="color: #4a5568; margin: 8px 0 4px 0; font-size: 13px;">📍 <strong>Location:</strong> ${p.location || "Kochi"}</p>
        <p style="color: #4a5568; margin: 4px 0; font-size: 13px;">🏠 <strong>Type:</strong> ${p.bedrooms || 3} BHK ${p.type || "Apartment"} | 📐 <strong>Area:</strong> ${p.area || "1450 sqft"}</p>
        <p style="color: #718096; margin: 6px 0 0 0; font-size: 12px; line-height: 1.4;">${p.description || "Ready to move in, prime connectivity with dedicated parking space."}</p>
      </div>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px; color: #2d3748; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background-color: #1a365d; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: bold; }
          .header p { margin: 6px 0 0 0; font-size: 12px; color: #cbd5e0; }
          .content { padding: 24px; }
          .btn-download { display: inline-block; background-color: #2b6cb0; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 16px 0; text-align: center; }
          .footer { background-color: #edf2f7; padding: 16px; text-align: center; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>REALTYPULSE REAL ESTATE AGENCY</h1>
            <p>Premium Residential & Commercial Properties | Kochi, Kerala</p>
          </div>
          <div class="content">
            <h2 style="color: #1a365d; font-size: 18px; margin-top: 0;">Hello ${customerName || "Valued Client"},</h2>
            <p style="font-size: 14px; line-height: 1.5; color: #4a5568;">
              Thank you for inquiring with RealtyPulse Real Estate Agency! Based on your requirement criteria, we have selected top verified property listings for you.
            </p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${pdfUrl}" class="btn-download" target="_blank">📄 Download Custom 6-Photo PDF Proposal Catalog</a>
            </div>

            <h3 style="color: #1a365d; font-size: 15px; border-bottom: 2px solid #edf2f7; padding-bottom: 6px;">RECOMMENDED PROPERTY MATCHES</h3>
            ${propertyCardsHtml || "<p>Properties attached in PDF Catalog.</p>"}

            <p style="font-size: 13px; color: #4a5568; margin-top: 24px;">
              Would you like to schedule a private site visit or discuss pricing details with our sales team? Reply directly to this email or call us at <strong>+91 9633541720</strong>.
            </p>
          </div>
          <div class="footer">
            RealtyPulse Real Estate Agency &bull; Kakkanad & MG Road, Kochi, Kerala<br>
            Phone / WhatsApp: +91 9633541720
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"RealtyPulse Real Estate" <${process.env.SENDER_EMAIL || "info.oaklinetechnologies@gmail.com"}>`,
      to: toEmail,
      subject: `🏠 Your Custom Property Proposal Catalog — RealtyPulse Agency (Ref: ${proposalId || "PROP"})`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Proposal Dispatched] Sent to ${toEmail} (MessageId: ${info.messageId || "JSON-DEV-MODE"})`);
    return { ok: true, messageId: info.messageId, recipient: toEmail };
  } catch (err) {
    console.error(`❌ [Email Proposal Dispatch Error]`, err.message);
    return { ok: false, error: err.message };
  }
}

export default { sendProposalEmail };
