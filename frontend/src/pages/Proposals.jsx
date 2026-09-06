import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";
import { FileText, ExternalLink, Download, Copy, Sparkles } from "lucide-react";

export default function Proposals() {
  const [properties, setProperties] = useState([]);
  const [selected, setSelected] = useState([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [status, setStatus] = useState("");
  const [generatedResult, setGeneratedResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    api.get("/properties").then(setProperties);
  }, []);

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function handleGenerate() {
    if (selected.length === 0) {
      alert("Please select at least 1 property to generate a proposal.");
      return;
    }
    setIsGenerating(true);
    setStatus("Generating 6-Photo PDF Proposal Catalog...");
    setGeneratedResult(null);

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyIds: selected,
          clientName: clientName || "Valued Client",
          email: clientEmail || null,
        }),
      });

      if (!res.ok) throw new Error("PDF generation API returned an error.");

      const data = await res.json();
      if (!data.ok || (!data.pdfUrl && !data.relativePath)) throw new Error("Invalid proposal PDF response.");

      setGeneratedResult(data);
      setStatus("Proposal PDF generated successfully!");
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <Topbar
        title="Proposal Generator Console"
        subtitle="Manually select property inventory to generate custom 6-photo multi-page PDF catalog proposals."
      />

      <div className="glass-card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Client Details</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <label className="field-label">Client Name</label>
            <input
              style={{ width: 260 }}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Rahul Menon"
            />
          </div>
          <div>
            <label className="field-label">Client Email (Optional for Auto-Mail)</label>
            <input
              style={{ width: 280 }}
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="e.g. client@example.com"
            />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 16 }}>Select Properties ({selected.length} Selected)</h3>
          <button
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 999 }}
            onClick={() => setSelected(selected.length === properties.length ? [] : properties.map((p) => p.id))}
          >
            {selected.length === properties.length ? "Deselect All" : "Select All Available"}
          </button>
        </div>

        <div className="property-grid">
          {properties.map((p) => {
            const isSel = selected.includes(p.id);
            return (
              <div
                key={p.id}
                className="glass-card property-card"
                onClick={() => toggle(p.id)}
                style={{
                  cursor: "pointer",
                  border: isSel ? "2px solid #2563EB" : "1px solid #E2E8F0",
                  background: isSel ? "#EFF6FF" : "#FFFFFF",
                  transition: "all 0.2s ease",
                  borderRadius: 20,
                }}
              >
                <div className="thumb">
                  {p.listingIntent === "to_rent" ? "FOR RENT" : "FOR SALE"} · {p.location}
                </div>
                <div className="body">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => {}}
                    />
                    <strong style={{ fontSize: 13.5 }}>{p.title}</strong>
                  </div>
                  <div className="price">₹{Number(p.price).toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    {p.bedrooms || 3} BHK {p.type || "Apartment"} ({p.images?.length || 0} Photos attached)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={selected.length === 0 || isGenerating}
          style={{ padding: "10px 20px", fontSize: 14, borderRadius: 999 }}
        >
          <FileText size={16} /> {isGenerating ? "Generating PDF..." : "Generate PDF Proposal"}
        </button>

        {status && <div style={{ fontSize: 13.5, fontWeight: 600, color: "#2563EB" }}>{status}</div>}
      </div>

      {/* Generated Result Box */}
      {generatedResult && (
        <div className="glass-card" style={{ marginTop: 20, padding: 20, background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
          <h4 style={{ color: "#047857", marginBottom: 6, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} /> PDF Proposal Catalog Ready!
          </h4>
          <p style={{ fontSize: 13, color: "#0F172A", marginBottom: 14 }}>
            Proposal ID: <strong>{generatedResult.proposalId}</strong> ({generatedResult.propertiesMatchedCount} Properties Included)
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href={`http://localhost:5001${generatedResult.relativePath}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ background: "#059669", borderRadius: 999 }}
            >
              <ExternalLink size={15} /> Open PDF Proposal in Browser
            </a>
            <a
              href={`http://localhost:5001${generatedResult.relativePath}`}
              download={generatedResult.filename}
              className="btn btn-secondary"
              style={{ borderRadius: 999 }}
            >
              <Download size={15} /> Download PDF File
            </a>
            <button
              className="btn btn-secondary"
              style={{ borderRadius: 999 }}
              onClick={() => {
                const shareLink = generatedResult.publicPdfUrl || `http://localhost:5001${generatedResult.relativePath}`;
                navigator.clipboard.writeText(shareLink);
                alert(`Copied Public PDF URL for WhatsApp/Telegram:\n${shareLink}`);
              }}
            >
              <Copy size={15} /> Copy Shareable Link (WhatsApp / Telegram)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
