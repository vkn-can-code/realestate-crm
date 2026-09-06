function getExotelConfig() {
  const accountSid = process.env.EXOTEL_ACCOUNT_SID || "developerlab2";
  const apiKey = process.env.EXOTEL_API_KEY || "eb1c6a3d8a468ed3b7d631ebfbb884d968167c042c87a3d9";
  const apiToken = process.env.EXOTEL_API_TOKEN || "ff869fed5218d54140e341f8e626b299111b8920b89919b4";
  const exoPhone = process.env.EXOTEL_EXOPHONE || "04954268937";
  const subdomain = process.env.EXOTEL_SUBDOMAIN || "api.exotel.com";

  return { accountSid, apiKey, apiToken, exoPhone, subdomain };
}

/** Places an automated outbound call via Exotel Connect API */
export async function triggerOutboundExotelCall({ toNumber, leadId, reason }) {
  const { accountSid, apiKey, apiToken, exoPhone, subdomain } = getExotelConfig();

  if (!apiToken) {
    console.warn("[Exotel Warning] EXOTEL_API_TOKEN is missing in backend/.env.");
  }

  // Format destination phone number for India (+91)
  let cleanTo = (toNumber || "").replace(/[^0-9]/g, "");
  if (cleanTo.length === 10) cleanTo = `0${cleanTo}`;

  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5001";
  const passthruUrl = `${baseUrl}/api/exotel/passthru`;

  const url = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`;
  const params = new URLSearchParams({
    From: cleanTo,
    To: exoPhone,
    CallerId: exoPhone,
    Url: passthruUrl,
    TimeLimit: "300",
    StatusCallback: `${baseUrl}/api/exotel/status`,
  });

  const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiToken}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[Exotel API Error]", data);
      return { ok: false, error: data.RestException?.Message || "Exotel API Error" };
    }

    console.log(`[Exotel Outbound Call Initiated] CallSid: ${data.Call?.Sid || "N/A"} to ${cleanTo}`);
    return { ok: true, callSid: data.Call?.Sid, data };
  } catch (err) {
    console.error("[Exotel Exception]", err.message);
    return { ok: false, error: err.message };
  }
}

export default { triggerOutboundExotelCall };
