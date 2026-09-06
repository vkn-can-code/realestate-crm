import { useState } from "react";
import { Sparkles, X, Check, Compass, Wand2 } from "lucide-react";

export default function AICreativeDirectorModal({
  isOpen,
  onClose,
  onApplyConcept,
  propertyData,
  brandKit,
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [conceptsResult, setConceptsResult] = useState(null);

  if (!isOpen) return null;

  const handleGenerateConcepts = async (customPrompt) => {
    const activePrompt = customPrompt || prompt || "Create a high-converting luxury real estate marketing creative";
    setLoading(true);
    setConceptsResult(null);

    try {
      const res = await fetch("/api/social/ai-creative-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          propertyData,
          brandKit,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConceptsResult(data);
      }
    } catch (err) {
      alert(`AI Creative Director Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const PROMPT_SUGGESTIONS = [
    "Create a cinematic luxury real estate post",
    "Make this look like a premium magazine advertisement",
    "Create a bold Instagram campaign for a price reduction",
    "Make an open house promotional design",
    "Create a minimal modern architecture poster",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)", color: "#FFF", padding: 10, borderRadius: 14 }}>
              <Wand2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: "800", color: "#0F172A", margin: 0 }}>AI Creative Director</h2>
              <p style={{ fontSize: 12.5, color: "#64748B", margin: 0 }}>Describe your creative vision to generate 4 distinct layout concepts.</p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
            <X size={20} />
          </button>
        </div>

        {/* Prompt Input Form */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: "700", color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            "Describe the creative you want..."
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a cinematic luxury real estate post for a waterfront villa..."
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 14,
                border: "1px solid #CBD5E1",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={() => handleGenerateConcepts()}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: "12px 24px", borderRadius: 14, fontWeight: "700", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Sparkles size={16} /> {loading ? "Directing..." : "Generate 4 Concepts"}
            </button>
          </div>

          {/* Prompt Suggestions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: "600", alignSelf: "center" }}>Quick Prompts:</span>
            {PROMPT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(sug);
                  handleGenerateConcepts(sug);
                }}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 999, fontSize: 11, padding: "4px 12px" }}
              >
                <Compass size={11} /> {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Sparkles size={36} color="#6366F1" style={{ animation: "spin 2s linear infinite" }} />
            <div style={{ fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 16 }}>AI Creative Director is analyzing property specs & layout geometry...</div>
            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>Synthesizing 4 distinct compositions with custom typography & colors.</div>
          </div>
        )}

        {/* Concepts Preview Grid */}
        {conceptsResult && conceptsResult.concepts && (
          <div>
            <div style={{ fontSize: 14, fontWeight: "800", color: "#0F172A", marginBottom: 14 }}>
              Select a Concept Direction ({conceptsResult.concepts.length} Generated) — Nothing is applied until you approve.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {conceptsResult.concepts.map((concept) => (
                <ConceptCard key={concept.id} concept={concept} onApply={() => { onApplyConcept(concept); onClose(); }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConceptCard({ concept, onApply }) {
  const design = concept.layout || concept;
  const cw = design.canvasWidth || 1080;
  const ch = design.canvasHeight || 1080;
  const scale = 260 / cw;
  const h = ch * scale;

  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", background: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Live Mini Preview Canvas */}
      <div style={{ position: "relative", width: "100%", height: h, background: design?.background?.value || "#0F172A", overflow: "hidden" }}>
        {(design?.layers || []).slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map((l) => (
          <MiniLayer key={l.id} layer={l} scale={scale} />
        ))}
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: "800", color: "#0F172A" }}>{concept.name}</span>
          <span style={{ background: "#EEF2FF", color: "#4F46E5", fontSize: 10, fontWeight: "800", padding: "2px 8px", borderRadius: 999 }}>
            {concept.styleCategory || "CONCEPT"}
          </span>
        </div>
        <p style={{ fontSize: 11.5, color: "#64748B", margin: "0 0 10px", lineHeight: 1.3 }}>{concept.desc}</p>
        <button onClick={onApply} className="btn btn-primary btn-sm" style={{ width: "100%", borderRadius: 8, justifyContent: "center", fontSize: 12 }}>
          <Check size={13} /> Use This Concept
        </button>
      </div>
    </div>
  );
}

function MiniLayer({ layer, scale }) {
  const style = {
    position: "absolute",
    left: layer.x * scale,
    top: layer.y * scale,
    width: layer.width * scale,
    height: layer.height * scale,
    overflow: "hidden",
    fontSize: Math.max(7, Math.round((layer.style?.fontSize || 14) * scale)),
    color: layer.style?.color || "#FFFFFF",
    fontWeight: layer.style?.fontWeight || "700",
    fontFamily: layer.style?.fontFamily || "Inter, sans-serif",
    textAlign: layer.style?.textAlign,
    background: layer.type === "shape" || layer.type === "badge" ? (layer.style?.backgroundColor || layer.style?.background || "#2563EB") : undefined,
    borderRadius: layer.style?.borderRadius ? layer.style.borderRadius * scale : undefined,
    whiteSpace: "nowrap",
  };

  if (layer.type === "image") {
    return <img src={layer.content} alt="" style={{ ...style, objectFit: layer.style?.objectFit || "cover" }} />;
  }
  return <div style={style}>{layer.type === "text" || layer.type === "badge" ? layer.content : ""}</div>;
}
