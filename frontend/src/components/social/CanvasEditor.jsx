import { useState, useRef } from "react";

export default function CanvasEditor({
  designConfig,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  platformRatio = "1:1",
}) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!designConfig || !designConfig.layers) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>
        Loading interactive design canvas...
      </div>
    );
  }

  // Calculate canvas dimensions based on platform ratio
  let aspectWidth = 500;
  let aspectHeight = 500;

  if (platformRatio === "4:5") {
    aspectWidth = 480;
    aspectHeight = 600;
  } else if (platformRatio === "9:16") {
    aspectWidth = 360;
    aspectHeight = 640;
  } else if (platformRatio === "1.91:1") {
    aspectWidth = 600;
    aspectHeight = 314;
  }

  const scale = aspectWidth / 1080;

  const handleMouseDown = (e, layer) => {
    e.stopPropagation();
    onSelectLayer(layer.id);
    setIsDragging(true);

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const layerXScaled = layer.x * scale;
    const layerYScaled = layer.y * scale;

    setDragOffset({
      x: e.clientX - canvasRect.left - layerXScaled,
      y: e.clientY - canvasRect.top - layerYScaled,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedLayerId) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newScaledX = e.clientX - canvasRect.left - dragOffset.x;
    const newScaledY = e.clientY - canvasRect.top - dragOffset.y;

    const unscaledX = Math.round(newScaledX / scale);
    const unscaledY = Math.round(newScaledY / scale);

    const targetLayer = designConfig.layers.find((l) => l.id === selectedLayerId);
    if (targetLayer && !targetLayer.locked) {
      onUpdateLayer(selectedLayerId, { x: unscaledX, y: unscaledY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const bgStyle = designConfig.background?.type === "gradient"
    ? { background: designConfig.background.value }
    : { backgroundColor: designConfig.background?.value || "#0F172A" };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "relative",
        userSelect: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Canvas Frame Container */}
      <div
        ref={canvasRef}
        onClick={() => onSelectLayer(null)}
        style={{
          width: aspectWidth,
          height: aspectHeight,
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.1)",
          transition: "width 0.3s ease, height 0.3s ease",
          ...bgStyle,
        }}
      >
        {/* Render Layers in Z-Index Order */}
        {designConfig.layers
          .slice()
          .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
          .map((layer) => {
            const isSelected = layer.id === selectedLayerId;
            const xScaled = layer.x * scale;
            const yScaled = layer.y * scale;
            const wScaled = layer.width * scale;
            const hScaled = layer.height * scale;

            const layerStyle = {
              position: "absolute",
              left: xScaled,
              top: yScaled,
              width: wScaled,
              height: hScaled,
              cursor: layer.locked ? "default" : "move",
              border: isSelected ? "2px solid #3B82F6" : "1px transparent dashed",
              boxShadow: isSelected ? "0 0 0 4px rgba(59, 130, 246, 0.25)" : "none",
              boxSizing: "border-box",
              borderRadius: layer.style?.borderRadius ? Math.round(layer.style.borderRadius * scale) : 0,
              zIndex: layer.zIndex || 1,
              transform: layer.rotation ? `rotate(${layer.rotation}deg)` : "none",
              transition: isDragging ? "none" : "border 0.15s ease",
              ...layer.style,
            };

            // Scale font size & padding proportionally
            if (layerStyle.fontSize) {
              layerStyle.fontSize = Math.max(10, Math.round(layerStyle.fontSize * scale));
            }
            if (layerStyle.padding && typeof layerStyle.padding === "string") {
              const parts = layerStyle.padding.split(" ");
              layerStyle.padding = parts.map(p => {
                const val = parseInt(p, 10);
                return isNaN(val) ? p : `${Math.max(2, Math.round(val * scale))}px`;
              }).join(" ");
            }

            return (
              <div
                key={layer.id}
                onMouseDown={(e) => handleMouseDown(e, layer)}
                style={layerStyle}
              >
                {/* Image Layer */}
                {layer.type === "image" && (
                  <img
                    src={layer.content}
                    alt={layer.name || "Layer"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: layer.style?.borderRadius ? layer.style.borderRadius * scale : 0,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Text Layer */}
                {layer.type === "text" && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      color: layer.style?.color || "#FFFFFF",
                      fontFamily: layer.style?.fontFamily || "Inter, sans-serif",
                      fontWeight: layer.style?.fontWeight || "700",
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {layer.content}
                  </div>
                )}

                {/* Badge Layer */}
                {layer.type === "badge" && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      backgroundColor: layer.style?.backgroundColor || "rgba(255,255,255,0.9)",
                      color: layer.style?.color || "#0F172A",
                      fontWeight: layer.style?.fontWeight || "800",
                      borderRadius: layer.style?.borderRadius ? layer.style.borderRadius * scale : 999,
                      fontSize: layerStyle.fontSize || 12,
                      boxSizing: "border-box",
                      backdropFilter: layer.style?.backdropFilter || "none",
                      border: layer.style?.border || "none",
                    }}
                  >
                    {layer.content}
                  </div>
                )}

                {/* Shape Layer */}
                {layer.type === "shape" && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: layer.style?.background || layer.style?.backgroundColor || "#FFFFFF",
                      borderRadius: layer.style?.borderRadius ? layer.style.borderRadius * scale : 0,
                      backdropFilter: layer.style?.backdropFilter || "none",
                    }}
                  />
                )}

                {/* Selection Resize Handles */}
                {isSelected && (
                  <>
                    <div style={{ position: "absolute", top: -4, left: -4, width: 8, height: 8, background: "#2563EB", border: "1px solid #FFF", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, background: "#2563EB", border: "1px solid #FFF", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", bottom: -4, left: -4, width: 8, height: 8, background: "#2563EB", border: "1px solid #FFF", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", bottom: -4, right: -4, width: 8, height: 8, background: "#2563EB", border: "1px solid #FFF", borderRadius: "50%" }} />
                  </>
                )}
              </div>
            );
          })}
      </div>

      {/* Canvas Dimensions Badge */}
      <div style={{ marginTop: 12, fontSize: 11.5, color: "#64748B", fontWeight: "600" }}>
        Interactive Studio Canvas ({aspectWidth} × {aspectHeight}px · Scale {(scale * 100).toFixed(0)}%) · Drag elements to reposition
      </div>
    </div>
  );
}
