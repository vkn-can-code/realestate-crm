# RealtyPulse CRM

A full-stack dashboard connecting your call bot + WhatsApp chat bot to a
real-estate CRM: unified lead inbox (calls / website / WhatsApp), property
database, AI-matched proposals, follow-up Kanban, meeting scheduling with
WhatsApp reminders, lead web-search, and a Nano Banana social poster studio.

## Structure

```
realestate-crm/
  backend/     Express API — mock data live, integration slots ready to wire
    routes/          One file per CRM section (leads, properties, followups, meetings, proposals, team, social, leadSearch)
    integrations/     Twilio / WhatsApp / AI call bot / summarizer / Nano Banana / web search — each a clearly marked plug slot (see integrations/README.md)
    data/store.js     In-memory mock DB — swap for Postgres/Mongo later behind the same shapes
  frontend/    React (Vite) dashboard — violet/white glassmorphism UI
    src/pages/         Dashboard, LeadDetail, LeadSearch, Properties, FollowUps, Meetings, Proposals, SocialMedia, Team
    src/components/    Sidebar, Topbar, shared UI (pills, stat cards)
    src/styles/index.css   All design tokens + glassmorphism styling in one place
```

## Running it

Requires Node 18+. Install dependencies (this sandbox has no network access,
so run these on your own machine):

```bash
cd backend && npm install && cp .env.example .env && npm run dev
cd frontend && npm install && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`
(Vite proxies `/api` to it — see `frontend/vite.config.js`).

## What's real vs. what's a plug slot

**Real and working right now, on mock data:**
- Full lead table with source filters (call / website / WhatsApp)
- Lead detail page with follow-up history and meeting list, keyed by Lead ID
- Property database (add/edit/list new arrivals)
- Follow-up Kanban board (Ongoing / Proposal Sent / Rejected) with drag-style column moves
- Meeting scheduling assigned to a sales team member
- **PDF proposal generation is fully functional** (pdfkit) — select properties, download a real branded PDF
- Team management (admin creates sales logins)

**Wired as plug slots, waiting on credentials from your API/dev team**
(each throws a clear "not configured" message until filled in — see
`backend/integrations/README.md` for the exact shape each one expects):
- Twilio — automatic call trigger on missed call/website enquiry, click-to-call
- WhatsApp Business API — sending matched properties live during a call, meeting reminders
- AI call/chat bot — requirement extraction + property matching
- Summarization API — writing the Follow-up 1 note after each call/chat
- Nano Banana — social media poster generation
- Web search — the Lead Search page's public lookup

Every route in `backend/routes/` already calls these integration functions
in the right place, so once real API keys land in `.env`, no route code
needs to change — only the marked `TODO(dev)` block inside each integration
file.

## Design

Palette, typography and the glass-card + violet sidebar treatment follow the
reference screenshots you provided (violet/white with light gradients and
glassmorphism panels).
