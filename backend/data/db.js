import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "crm.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// 1. LEADS TABLE
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    property_interest TEXT,
    source TEXT DEFAULT 'excel_import',
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try { db.exec("ALTER TABLE leads ADD COLUMN dnd INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN kanban_stage TEXT DEFAULT 'New';"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN assigned_to TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN budget TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN location TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN requirement TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN property_type TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN timeline TEXT DEFAULT '1-3 Months';"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN lead_temperature TEXT DEFAULT 'Warm';"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN last_interaction_at DATETIME;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN next_action TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN next_action_date DATETIME;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN next_action_type TEXT DEFAULT 'Call';"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN follow_up_status TEXT DEFAULT 'Pending';"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN automation_status TEXT DEFAULT 'Active';"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN communication_preference TEXT DEFAULT 'WhatsApp';"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN estimated_closing_date TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN contract_status TEXT DEFAULT 'Pre-Agreement';"); } catch (e) {}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
  CREATE INDEX IF NOT EXISTS idx_leads_kanban_stage ON leads(kanban_stage);
  CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

  -- LEAD ACTIVITIES CHRONOLOGICAL TIMELINE
  CREATE TABLE IF NOT EXISTS lead_activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    performed_by TEXT DEFAULT 'system',
    performed_by_name TEXT DEFAULT 'System',
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);

  -- AUTOMATION RULES ENGINE TABLE
  CREATE TABLE IF NOT EXISTS automation_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    delay_minutes INTEGER DEFAULT 0,
    condition_json TEXT,
    action_type TEXT NOT NULL,
    automation_level TEXT CHECK(automation_level IN ('level_1_suggestion', 'level_2_assisted', 'level_3_full')) DEFAULT 'level_2_assisted',
    escalation_json TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );


  -- 2. IMPORT BATCHES TABLE
  CREATE TABLE IF NOT EXISTS import_batches (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    row_count INTEGER DEFAULT 0,
    new_leads_count INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,
    flagged_for_review_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try { db.exec("ALTER TABLE import_batches ADD COLUMN flagged_for_review_count INTEGER DEFAULT 0;"); } catch (e) {}

// 3. OUTREACH LOG TABLE
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS outreach_log (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK(channel IN ('whatsapp', 'call', 'telegram')),
      type TEXT NOT NULL CHECK(type IN ('initial_outreach', 're_engagement', 'inbound_call')),
      status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed', 'answered', 'no_answer')),
      triggered_by TEXT NOT NULL CHECK(triggered_by IN ('auto', 'manual')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_lead_channel_type UNIQUE(lead_id, channel, type)
    );
  `);
} catch (e) {}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_outreach_lead_id ON outreach_log(lead_id);

  -- 4. REVIEW QUEUE TABLE FOR RE-IMPORTED / DUPLICATE LEADS
  CREATE TABLE IF NOT EXISTS review_queue (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    import_batch_id TEXT REFERENCES import_batches(id),
    new_row_data TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'skipped', 'reengaged', 'marked_dnd')) DEFAULT 'pending',
    resolved_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);

  -- 5. STAGE HISTORY AUDIT TRAIL LOG TABLE
  CREATE TABLE IF NOT EXISTS stage_history (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    from_stage TEXT NOT NULL,
    to_stage TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_by_name TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_stage_history_lead_id ON stage_history(lead_id);

  -- 6. MARKET & COMPETITOR INTELLIGENCE TABLES
  CREATE TABLE IF NOT EXISTS intelligence_competitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brokerage_type TEXT,
    website TEXT NOT NULL,
    logo TEXT,
    headquarters TEXT,
    is_active INTEGER DEFAULT 1,
    crawl_frequency TEXT DEFAULT 'weekly',
    max_pages INTEGER DEFAULT 50,
    include_patterns TEXT,
    exclude_patterns TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intelligence_markets (
    id TEXT PRIMARY KEY,
    country TEXT DEFAULT 'United States',
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    county TEXT,
    zip_code TEXT NOT NULL,
    neighborhood TEXT,
    property_types TEXT,
    price_segments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intelligence_scan_jobs (
    id TEXT PRIMARY KEY,
    competitor_id TEXT NOT NULL REFERENCES intelligence_competitors(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'firecrawl',
    status TEXT CHECK(status IN ('queued', 'running', 'completed', 'failed')) DEFAULT 'queued',
    pages_discovered INTEGER DEFAULT 0,
    pages_scraped INTEGER DEFAULT 0,
    listings_extracted INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    log_output TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intelligence_observed_listings (
    id TEXT PRIMARY KEY,
    competitor_id TEXT NOT NULL REFERENCES intelligence_competitors(id) ON DELETE CASCADE,
    external_property_id TEXT,
    source_name TEXT DEFAULT 'Firecrawl Web Observation',
    source_url TEXT NOT NULL,
    property_title TEXT,
    property_type TEXT,
    property_sub_type TEXT,
    bedrooms INTEGER,
    bathrooms REAL,
    square_feet INTEGER,
    lot_size TEXT,
    year_built INTEGER,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    neighborhood TEXT,
    latitude REAL,
    longitude REAL,
    asking_price REAL,
    price_currency TEXT DEFAULT 'USD',
    price_per_sqft REAL,
    listing_status TEXT DEFAULT 'Active',
    agent_name TEXT,
    brokerage_name TEXT,
    dedup_hash TEXT UNIQUE,
    confidence_score REAL DEFAULT 0.95,
    raw_data_json TEXT,
    first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intelligence_snapshots (
    id TEXT PRIMARY KEY,
    observed_listing_id TEXT NOT NULL REFERENCES intelligence_observed_listings(id) ON DELETE CASCADE,
    asking_price REAL,
    listing_status TEXT,
    raw_snapshot_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intelligence_change_events (
    id TEXT PRIMARY KEY,
    observed_listing_id TEXT NOT NULL REFERENCES intelligence_observed_listings(id) ON DELETE CASCADE,
    competitor_id TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK(change_type IN ('NEW_LISTING', 'PRICE_REDUCTION', 'PRICE_INCREASE', 'STATUS_CHANGE', 'LISTING_REMOVED', 'FEATURE_CHANGE')),
    previous_value TEXT,
    new_value TEXT,
    numeric_difference REAL,
    percentage_change REAL,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intelligence_alerts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 7. AGENT RECRUITMENT AI TABLES
  CREATE TABLE IF NOT EXISTS recruitment_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_role TEXT NOT NULL,
    location TEXT NOT NULL,
    min_experience_years INTEGER DEFAULT 0,
    specialization TEXT,
    keywords TEXT,
    target_companies TEXT,
    description TEXT,
    preferred_channel TEXT DEFAULT 'email',
    status TEXT CHECK(status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'active',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recruitment_prospects (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES recruitment_campaigns(id) ON DELETE CASCADE,
    apollo_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    job_title TEXT,
    company_name TEXT,
    location TEXT,
    linkedin_url TEXT,
    experience_years INTEGER,
    status TEXT CHECK(status IN ('DISCOVERED', 'PENDING_REVIEW', 'SHORTLISTED', 'APPROVED', 'CONTACT_READY', 'MESSAGE_DRAFTED', 'MESSAGE_APPROVED', 'CONTACTED', 'REPLIED', 'INTERESTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'NOT_INTERESTED', 'DO_NOT_CONTACT')) DEFAULT 'DISCOVERED',
    review_notes TEXT,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prospect_contacts (
    id TEXT PRIMARY KEY,
    prospect_id TEXT UNIQUE NOT NULL REFERENCES recruitment_prospects(id) ON DELETE CASCADE,
    email TEXT,
    email_status TEXT DEFAULT 'unverified',
    phone TEXT,
    phone_status TEXT DEFAULT 'unverified',
    whatsapp_optin INTEGER DEFAULT 0,
    whatsapp_optin_timestamp DATETIME,
    whatsapp_optin_source TEXT,
    contact_source TEXT DEFAULT 'apollo',
    last_enriched_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prospect_ai_analysis (
    id TEXT PRIMARY KEY,
    prospect_id TEXT UNIQUE NOT NULL REFERENCES recruitment_prospects(id) ON DELETE CASCADE,
    match_score INTEGER DEFAULT 0,
    key_strengths TEXT,
    potential_fit TEXT,
    recruitment_angle TEXT,
    personalization_suggestions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS outreach_messages (
    id TEXT PRIMARY KEY,
    prospect_id TEXT NOT NULL REFERENCES recruitment_prospects(id) ON DELETE CASCADE,
    channel TEXT CHECK(channel IN ('email', 'whatsapp')) DEFAULT 'email',
    subject TEXT,
    body TEXT NOT NULL,
    whatsapp_template_name TEXT,
    status TEXT CHECK(status IN ('DRAFT', 'ADMIN_APPROVED', 'READY_TO_SEND', 'SENT', 'DELIVERED', 'FAILED', 'REPLIED')) DEFAULT 'DRAFT',
    approved_by TEXT,
    approved_at DATETIME,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recruitment_conversations (
    id TEXT PRIMARY KEY,
    prospect_id TEXT NOT NULL REFERENCES recruitment_prospects(id) ON DELETE CASCADE,
    sender TEXT CHECK(sender IN ('candidate', 'ai_agent', 'recruiter', 'system')) NOT NULL,
    channel TEXT NOT NULL,
    message_text TEXT NOT NULL,
    intent_detected TEXT,
    ai_confidence REAL DEFAULT 1.0,
    escalated_to_human INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recruitment_interviews (
    id TEXT PRIMARY KEY,
    prospect_id TEXT NOT NULL REFERENCES recruitment_prospects(id) ON DELETE CASCADE,
    recruiter_name TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    meeting_link TEXT,
    status TEXT CHECK(status IN ('scheduled', 'completed', 'canceled', 'no_show')) DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recruitment_events (
    id TEXT PRIMARY KEY,
    prospect_id TEXT REFERENCES recruitment_prospects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    performed_by_name TEXT,
    details_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recruitment_executions (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES recruitment_campaigns(id) ON DELETE CASCADE,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT CHECK(status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL_SUCCESS')) DEFAULT 'QUEUED',
    profiles_found INTEGER DEFAULT 0,
    profiles_imported INTEGER DEFAULT 0,
    duplicates_skipped INTEGER DEFAULT 0,
    error_message TEXT,
    search_params_json TEXT
  );
`);

// Safe migration for recruitment_campaigns table extra columns
try { db.prepare("ALTER TABLE recruitment_campaigns ADD COLUMN search_mode TEXT DEFAULT 'include_other_matching'").run(); } catch(e) {}
try { db.prepare("ALTER TABLE recruitment_campaigns ADD COLUMN last_run_at DATETIME").run(); } catch(e) {}
try { db.prepare("ALTER TABLE recruitment_campaigns ADD COLUMN last_run_status TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE recruitment_campaigns ADD COLUMN prospects_found_count INTEGER DEFAULT 0").run(); } catch(e) {}
try { db.prepare("ALTER TABLE recruitment_campaigns ADD COLUMN prospects_imported_count INTEGER DEFAULT 0").run(); } catch(e) {}
try { db.prepare("ALTER TABLE recruitment_campaigns ADD COLUMN duplicates_skipped_count INTEGER DEFAULT 0").run(); } catch(e) {}
try { db.prepare("ALTER TABLE recruitment_campaigns ADD COLUMN last_error TEXT").run(); } catch(e) {}

// 8. CLIENT COMMUNICATION & DOCUMENT INTELLIGENCE TABLES
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    primary_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    telegram_id TEXT,
    lead_score INTEGER DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS communications (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK(channel IN ('email', 'whatsapp', 'telegram', 'call', 'website')),
    direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
    sender TEXT NOT NULL,
    sender_name TEXT,
    recipient TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    attachments_json TEXT,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS channel_settings (
    channel TEXT PRIMARY KEY CHECK(channel IN ('email', 'whatsapp', 'telegram', 'instagram', 'facebook', 'website')),
    config_json TEXT NOT NULL,
    status TEXT CHECK(status IN ('CONNECTED', 'DISCONNECTED', 'ERROR', 'NEEDS_REAUTHENTICATION')) DEFAULT 'CONNECTED',
    is_active INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    source_channel TEXT DEFAULT 'email',
    category TEXT DEFAULT 'GENERAL',
    summary TEXT,
    approval_status TEXT CHECK(approval_status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS document_extractions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    confidence_score REAL DEFAULT 0.9,
    extracted_json TEXT NOT NULL,
    ai_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_review_queue (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('UNMATCHED_IDENTITY', 'DOCUMENT_EXTRACTION', 'CRM_FIELD_UPDATE')),
    title TEXT NOT NULL,
    source_channel TEXT NOT NULL,
    raw_input_json TEXT NOT NULL,
    current_value_json TEXT,
    ai_suggested_value_json TEXT NOT NULL,
    confidence_score REAL DEFAULT 0.85,
    status TEXT CHECK(status IN ('NEEDS_HUMAN_REVIEW', 'APPROVED', 'REJECTED', 'EDITED_AND_APPROVED')) DEFAULT 'NEEDS_HUMAN_REVIEW',
    resolved_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_communications_client_id ON communications(client_id);
  CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
  CREATE INDEX IF NOT EXISTS idx_ai_review_queue_status ON ai_review_queue(status);

  -- BROKERAGE BRAND KITS TABLE
  CREATE TABLE IF NOT EXISTS brand_kits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brokerage_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#1E293B',
    accent_color TEXT DEFAULT '#F59E0B',
    agent_name TEXT,
    agent_phone TEXT,
    agent_email TEXT,
    website TEXT,
    social_handles TEXT,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- SOCIAL POSTS HISTORY TABLE
  CREATE TABLE IF NOT EXISTS social_posts (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    template_id TEXT NOT NULL,
    platform TEXT DEFAULT 'instagram_post',
    headline TEXT,
    subheadline TEXT,
    caption TEXT,
    hashtags TEXT,
    image_config TEXT,
    brand_kit_id TEXT,
    status TEXT CHECK(status IN ('DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED')) DEFAULT 'DRAFT',
    created_by TEXT DEFAULT 'Admin Manager',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
  CREATE INDEX IF NOT EXISTS idx_social_posts_property ON social_posts(property_id);
`);

try { db.prepare("ALTER TABLE leads ADD COLUMN client_id TEXT REFERENCES clients(id);").run(); } catch(e) {}
try { db.prepare("ALTER TABLE leads ADD COLUMN match_confidence REAL DEFAULT 1.0;").run(); } catch(e) {}
try { db.prepare("ALTER TABLE leads ADD COLUMN match_status TEXT DEFAULT 'MATCHED';").run(); } catch(e) {}

// Seed default brand kit if empty
try {
  const kitCount = db.prepare("SELECT COUNT(*) as count FROM brand_kits").get()?.count || 0;
  if (kitCount === 0) {
    db.prepare(`
      INSERT INTO brand_kits (id, name, brokerage_name, logo_url, primary_color, secondary_color, accent_color, agent_name, agent_phone, agent_email, website, social_handles, is_default)
      VALUES ('brand-default-1', 'Premier Luxury Realty Brand Kit', 'RealtyPulse Premier Brokerage', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&auto=format&fit=crop', '#2563EB', '#0F172A', '#D97706', 'Adwayth VS', '+1 (800) 555-REAL', 'adwayth@realtypulse.com', 'www.realtypulse.com', '@RealtyPulseUSA', 1)
    `).run();
  }
} catch (e) {}

console.log("[SQLite DB] Client Communication, Document Intelligence & Social Media Studio Schema Active!");

export default db;
export { uuidv4 as newUuid };
