import sqlite3 from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'crm.db');
const db = sqlite3(dbPath);

console.log('Starting migration...');

db.transaction(() => {
  db.exec('ALTER TABLE outreach_log RENAME TO outreach_log_old');

  db.exec(`
    CREATE TABLE outreach_log (
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

  db.exec(`
    INSERT INTO outreach_log (id, lead_id, channel, type, status, triggered_by, created_at, updated_at)
    SELECT id, lead_id, channel, type, status, triggered_by, created_at, updated_at FROM outreach_log_old;
  `);

  db.exec('DROP TABLE outreach_log_old');
  db.exec('CREATE INDEX idx_outreach_lead_id ON outreach_log(lead_id);');

})();

console.log('Migration completed successfully!');
