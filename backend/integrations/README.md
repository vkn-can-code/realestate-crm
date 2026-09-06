# Integrations & Vapi.ai Telephony Architecture

This directory details external integrations for the RealtyPulse Real Estate CRM.

---

## 🎙️ Vapi.ai Voice Agent Integration

Telephony, Speech-to-Text (STT), and Text-to-Speech (TTS) are fully consolidated into **Vapi.ai** (connected to the Exotel Indian ExoPhone via a BYO SIP Trunk).

### Environment Variables (.env)
- `VAPI_PRIVATE_API_KEY`: Obtained from Vapi Dashboard (Settings ➔ API Keys).
- `VAPI_ASSISTANT_ID`: The ID of the AIRA Voice Assistant created in Vapi Dashboard.
- `VAPI_PHONE_NUMBER_ID`: The ID of the imported Exotel SIP trunk phone number in Vapi.
- `VAPI_WEBHOOK_SECRET`: (Optional) Secret key used to verify incoming Vapi webhooks.

### Backend Endpoints
- `POST /api/vapi/llm`: OpenAI-compatible Custom LLM endpoint called by Vapi during calls to query our n8n Master Workflow (Gemini 2.5 Flash + RAG).
- `POST /api/vapi/webhook`: Receives `end-of-call-report` and status events to automatically persist Voice Call Leads and Transcripts into `crm_database.json`.

---

## 🔌 Other Integration Slots

| File | Used for | Fires from |
|---|---|---|
| `exotel.js` | Outbound call dispatch via Exotel REST API | `routes/exotelRoutes.js` |
| `n8n.js` | Dispatching customer messages to n8n AI Master Workflow | `routes/vapiRoutes.js`, `routes/aiRoutes.js` |
| `whatsapp.js` | Sending matched property brochures live during a call, meeting reminders | `routes/leads.js`, `routes/meetings.js` |
| `telegram.js` | Live Telegram lead & admin notification channels | `server.js` |
