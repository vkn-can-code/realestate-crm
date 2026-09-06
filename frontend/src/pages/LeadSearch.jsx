import { useState } from "react";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";

export default function LeadSearch() {
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api.get(`/lead-search?name=${encodeURIComponent(name)}`);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar
        title="Lead Search"
        subtitle="Look up a lead's public details across the web from a name."
      />

      <div className="glass-card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
          <input
            style={{ flex: 1 }}
            placeholder="Enter lead's full name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !name}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
      </div>

      {error && (
        <div className="glass-card" style={{ color: "var(--danger)", fontSize: 13.5 }}>
          Web search isn't connected yet: {error}
        </div>
      )}

      {result && (
        <div className="glass-card">
          <h3 style={{ marginBottom: 10 }}>Results for "{result.name}"</h3>
          {result.results.length === 0 ? (
            <div className="empty-state">No public results found (or search API not yet connected).</div>
          ) : (
            result.results.map((r, i) => <div key={i}>{r.title}</div>)
          )}
        </div>
      )}
    </>
  );
}
