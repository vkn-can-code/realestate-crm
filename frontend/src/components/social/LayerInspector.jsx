import { ArrowUp, ArrowDown, Copy, Trash2, Lock, Unlock, Type, Palette } from "lucide-react";

export default function LayerInspector({
  selectedLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
}) {
  if (!selectedLayer) {
    return (
      <div className="glass-card" style={{ padding: 20, textAlign: "center", color: "#64748B" }}>
        <div style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>No Element Selected</div>
        <div style={{ fontSize: 11.5, color: "#94A3B8" }}>Click any element on the canvas to inspect & adjust styling.</div>
      </div>
    );
  }

  const handleStyleChange = (prop, value) => {
    onUpdateLayer(selectedLayer.id, {
      style: {
        ...selectedLayer.style,
        [prop]: value,
      },
    });
  };

  return (
    <div className="glass-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header & Quick Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: "800", color: "#0F172A" }}>{selectedLayer.name || "Layer Inspector"}</div>
          <div style={{ fontSize: 10.5, color: "#64748B", textTransform: "uppercase", fontWeight: "700" }}>Type: {selectedLayer.type}</div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onUpdateLayer(selectedLayer.id, { locked: !selectedLayer.locked })}
            className="btn btn-secondary btn-sm"
            title={selectedLayer.locked ? "Unlock Layer" : "Lock Layer"}
            style={{ padding: 6, borderRadius: 8 }}
          >
            {selectedLayer.locked ? <Lock size={14} color="#EF4444" /> : <Unlock size={14} />}
          </button>

          <button
            onClick={() => onDuplicateLayer(selectedLayer.id)}
            className="btn btn-secondary btn-sm"
            title="Duplicate Layer"
            style={{ padding: 6, borderRadius: 8 }}
          >
            <Copy size={14} />
          </button>

          <button
            onClick={() => onDeleteLayer(selectedLayer.id)}
            className="btn btn-secondary btn-sm"
            title="Delete Layer"
            style={{ padding: 6, borderRadius: 8, color: "#DC2626" }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* TEXT CONTENT EDITING */}
      {(selectedLayer.type === "text" || selectedLayer.type === "badge") && (
        <div>
          <label style={{ fontSize: 11, fontWeight: "700", color: "#475569", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <Type size={12} /> Text Content
          </label>
          <textarea
            rows={2}
            value={selectedLayer.content || ""}
            onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 12.5, border: "1px solid #CBD5E1", boxSizing: "border-box" }}
          />
        </div>
      )}

      {/* TYPOGRAPHY CONTROLS */}
      {selectedLayer.type === "text" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
              Font Family
            </label>
            <select
              value={selectedLayer.style?.fontFamily || "Inter, sans-serif"}
              onChange={(e) => handleStyleChange("fontFamily", e.target.value)}
              style={{ width: "100%", padding: "6px 10px", borderRadius: 8, fontSize: 12, border: "1px solid #CBD5E1" }}
            >
              <option value="Inter, sans-serif">Inter (Modern Sans)</option>
              <option value="Playfair Display, Georgia, serif">Playfair Display (Luxury Serif)</option>
              <option value="Montserrat, sans-serif">Montserrat (Geometric)</option>
              <option value="Roboto, sans-serif">Roboto (Clean)</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: "700", color: "#475569" }}>Font Size (px)</label>
              <input
                type="number"
                value={selectedLayer.style?.fontSize || 24}
                onChange={(e) => handleStyleChange("fontSize", parseInt(e.target.value) || 14)}
                style={{ width: "100%", padding: "6px 10px", borderRadius: 8, fontSize: 12, border: "1px solid #CBD5E1", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: "700", color: "#475569" }}>Font Weight</label>
              <select
                value={selectedLayer.style?.fontWeight || "700"}
                onChange={(e) => handleStyleChange("fontWeight", e.target.value)}
                style={{ width: "100%", padding: "6px 10px", borderRadius: 8, fontSize: 12, border: "1px solid #CBD5E1" }}
              >
                <option value="400">Regular (400)</option>
                <option value="600">SemiBold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">ExtraBold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* COLOR CONTROLS */}
      <div>
        <label style={{ fontSize: 11, fontWeight: "700", color: "#475569", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <Palette size={12} /> Color & Fill
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {selectedLayer.type === "text" && (
            <div>
              <span style={{ fontSize: 11, color: "#64748B" }}>Text Color</span>
              <input
                type="color"
                value={selectedLayer.style?.color || "#FFFFFF"}
                onChange={(e) => handleStyleChange("color", e.target.value)}
                style={{ width: "100%", height: 32, padding: 0, border: "none", borderRadius: 6, cursor: "pointer" }}
              />
            </div>
          )}

          {(selectedLayer.type === "badge" || selectedLayer.type === "shape") && (
            <div>
              <span style={{ fontSize: 11, color: "#64748B" }}>Background</span>
              <input
                type="color"
                value={selectedLayer.style?.backgroundColor || "#FFFFFF"}
                onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                style={{ width: "100%", height: 32, padding: 0, border: "none", borderRadius: 6, cursor: "pointer" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* LAYER ORDERING (Z-INDEX) */}
      <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 10 }}>
        <label style={{ fontSize: 11, fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          Layer Position
        </label>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onUpdateLayer(selectedLayer.id, { zIndex: (selectedLayer.zIndex || 1) + 1 })}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, borderRadius: 8, fontSize: 11 }}
          >
            <ArrowUp size={13} /> Bring Forward
          </button>
          <button
            onClick={() => onUpdateLayer(selectedLayer.id, { zIndex: Math.max(1, (selectedLayer.zIndex || 1) - 1) })}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, borderRadius: 8, fontSize: 11 }}
          >
            <ArrowDown size={13} /> Send Backward
          </button>
        </div>
      </div>
    </div>
  );
}
