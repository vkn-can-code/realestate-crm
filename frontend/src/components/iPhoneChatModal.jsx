import { useState, useEffect } from "react";
import { X, Send, Sparkles, PhoneCall, FileText, Building, CheckCheck, Wifi, Battery, Bot, Smartphone, MessageSquare } from "lucide-react";

export default function IPhoneChatModal({ lead, onClose, onRefresh }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMsg, setInputMsg] = useState("");
  const [rephrasing, setRephrasing] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

  const leadId = lead?.id;
  const leadName = lead?.name || "Client";
  const channel = (lead?.source || "website").toUpperCase();

  const fetchCommunications = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/communications/lead/${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (err) {
      console.error("[iPhone Chat Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
    const interval = setInterval(() => {
      if (leadId) {
        fetch(`/api/communications/lead/${leadId}`)
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) setMessages(data);
          })
          .catch(() => {});
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [leadId]);

  // AI Tone Rephrase
  async function handleAiRephrase(tone) {
    if (!inputMsg.trim()) return;
    setRephrasing(true);
    try {
      const res = await fetch("/api/communications/ai-rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputMsg, tone }),
      });
      const data = await res.json();
      if (data.rephrasedText) setInputMsg(data.rephrasedText);
    } catch (err) {
      setActionNotice(`Rephrase error: ${err.message}`);
    } finally {
      setRephrasing(false);
    }
  }

  // Send Message Action
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const textToSend = inputMsg;
    setInputMsg("");
    setActionNotice("Sending message via " + channel + "...");

    try {
      await fetch("/api/ai/start-engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          channel: (lead?.source || "whatsapp").toLowerCase(),
          customMessage: textToSend,
          conversationMode: "OUTBOUND",
        }),
      });

      setActionNotice("✅ Message sent & logged!");
      fetchCommunications();
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionNotice(`Note: ${err.message}`);
    }
  }

  // Quick Action: Send Proposal
  async function handleSendProposal() {
    setActionNotice("📄 Generating personalized proposal...");
    try {
      const res = await fetch("/api/ai/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      setActionNotice(`✅ Proposal generated & sent! Proposal ID: ${data.proposal?.proposalId || "PROP-001"}`);
      fetchCommunications();
    } catch (err) {
      setActionNotice(`Proposal note: ${err.message}`);
    }
  }

  // Quick Action: Trigger Call Bot
  async function handleTriggerCallBot() {
    setActionNotice("📞 Triggering Vapi AI Call Bot...");
    try {
      const res = await fetch("/api/vapi/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, phone: lead?.phone }),
      });
      setActionNotice("🚀 AI Call Bot initialized! Calling lead...");
      fetchCommunications();
    } catch (err) {
      setActionNotice(`Call Bot note: ${err.message}`);
    }
  }

  if (!lead) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: 20,
      }}
      onClick={onClose}
    >
      {/* iPhone Glass Titanium Mockup Frame */}
      <div
        style={{
          width: 410,
          height: 780,
          maxHeight: "92vh",
          background: "#0F172A",
          borderRadius: 48,
          border: "4px solid #334155",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 2px rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic Island / iPhone Notch Header Bar */}
        <div style={{ background: "#0F172A", height: 38, padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}>
          <span>9:41</span>
          {/* Dynamic Island Pill */}
          <div style={{ background: "#000000", width: 95, height: 20, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
            <span style={{ fontSize: 9, color: "#94A3B8" }}>AI Active</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Wifi size={13} />
            <Battery size={15} />
          </div>
        </div>

        {/* iPhone Chat App Navigation Header */}
        <div style={{ background: "rgba(30, 41, 59, 0.95)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#FFFFFF" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #2563EB, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>
              {leadName[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#F8FAFC", display: "flex", alignItems: "center", gap: 6 }}>
                {leadName}
                <span style={{ fontSize: 9.5, background: "rgba(37, 99, 235, 0.25)", color: "#60A5FA", padding: "2px 6px", borderRadius: 999, border: "1px solid rgba(96, 165, 250, 0.3)" }}>
                  {channel}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} /> Online · {lead.phone}
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#94A3B8", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {/* Shortcut Quick Action Toolbar */}
        <div style={{ background: "#1E293B", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, overflowX: "auto" }}>
          <button onClick={handleSendProposal} style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", whiteSpace: "nowrap" }}>
            <FileText size={12} /> Send Proposal
          </button>
          <button onClick={handleTriggerCallBot} style={{ background: "#7C3AED", color: "#FFF", border: "none", borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", whiteSpace: "nowrap" }}>
            <PhoneCall size={12} /> Trigger Call Bot
          </button>
        </div>

        {actionNotice && (
          <div style={{ background: "#0284C7", color: "#FFFFFF", padding: "6px 12px", fontSize: 11.5, fontWeight: 700, textAlign: "center" }}>
            {actionNotice}
          </div>
        )}

        {/* Message Stream Area */}
        <div style={{ flex: 1, padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, background: "#0F172A" }}>
          {loading ? (
            <div style={{ color: "#64748B", fontSize: 12, textAlign: "center", margin: "auto" }}>Loading communications...</div>
          ) : messages.length === 0 ? (
            <div style={{ color: "#64748B", fontSize: 12, textAlign: "center", margin: "auto", padding: 20 }}>
              No chat history yet. Send first outreach message or proposal below!
            </div>
          ) : (
            messages.map((m) => {
              const isInbound = m.direction === "inbound";
              return (
                <div key={m.id} style={{ alignSelf: isInbound ? "flex-start" : "flex-end", maxWidth: "82%" }}>
                  <div
                    style={{
                      background: isInbound ? "#334155" : "#2563EB",
                      color: "#FFFFFF",
                      padding: "10px 14px",
                      borderRadius: isInbound ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                      fontSize: 13,
                      lineHeight: 1.4,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {m.subject && <div style={{ fontSize: 11.5, fontWeight: 800, color: "#93C5FD", marginBottom: 2 }}>{m.subject}</div>}
                    <div>{m.body}</div>
                  </div>
                  <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 3, textAlign: isInbound ? "left" : "right", display: "flex", alignItems: "center", gap: 4, justifyContent: isInbound ? "flex-start" : "flex-end" }}>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {!isInbound && <CheckCheck size={12} color="#60A5FA" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Tone Rephraser Bar */}
        <div style={{ background: "#1E293B", padding: "6px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 6, overflowX: "auto" }}>
          <span style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            <Sparkles size={11} color="#38BDF8" /> AI Rephrase:
          </span>
          {["Professional", "Friendly", "Concise", "Persuasive", "Formal"].map((t) => (
            <button
              key={t}
              type="button"
              disabled={rephrasing || !inputMsg.trim()}
              onClick={() => handleAiRephrase(t)}
              style={{ background: "rgba(255,255,255,0.08)", color: "#E2E8F0", border: "none", borderRadius: 999, padding: "3px 8px", fontSize: 10, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* iOS Input Bar */}
        <form onSubmit={handleSendMessage} style={{ background: "#0F172A", padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="iMessage / AI Response..."
            style={{
              flex: 1,
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: 999,
              padding: "8px 16px",
              color: "#FFFFFF",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!inputMsg.trim()}
            style={{
              background: inputMsg.trim() ? "#2563EB" : "#334155",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: inputMsg.trim() ? "pointer" : "default",
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
