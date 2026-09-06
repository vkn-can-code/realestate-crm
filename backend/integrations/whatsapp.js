// WhatsApp Business plug slot — property brochures during a live call,
// meeting reminders, and the manual "send via click" button.
// TODO(dev): wire to your WhatsApp Business Cloud API (Meta) or BSP of choice:
//   POST `${WHATSAPP_API_URL}/messages` with Authorization: Bearer WHATSAPP_API_TOKEN
//   body: { messaging_product: "whatsapp", to, type: "document"|"text", ... }

function assertConfigured() {
  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
    throw new Error(
      "WhatsApp is not configured yet. Add WHATSAPP_API_URL / WHATSAPP_API_TOKEN / CRM_WHATSAPP_NUMBER to .env"
    );
  }
}

/** Sends a matched property (or generated PDF proposal) to a lead's WhatsApp number. */
export async function sendPropertyDocument({ toNumber, documentUrl, caption }) {
  assertConfigured();
  // TODO(dev): call the Cloud API "document" message type with documentUrl
  return { status: "sent", toNumber, documentUrl, caption };
}

/** Sends a plain text reminder (e.g. meeting reminder) from the CRM's allocated number. */
export async function sendTextMessage({ toNumber, message }) {
  assertConfigured();
  return { status: "sent", toNumber, message };
}

export default { sendPropertyDocument, sendTextMessage };
