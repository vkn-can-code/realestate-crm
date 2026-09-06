import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, User, Phone, Star, AlertTriangle, ChevronRight } from "lucide-react";

export default function BookMeeting() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId") || "";

  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0]);
  const [slotsData, setSlotsData] = useState([]);
  const [selectedRep, setSelectedRep] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [leadDetails, setLeadDetails] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-fetch lead name & phone if leadId parameter is provided
  useEffect(() => {
    if (leadId) {
      fetch(`/api/leads/${leadId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setLeadDetails({ name: data.name || "", phone: data.phone || "" });
          }
        })
        .catch((err) => console.error("Failed to fetch lead info:", err));
    }
  }, [leadId]);

  // Fetch available slots for selected date
  useEffect(() => {
    fetch(`/api/meetings/slots?date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        setSlotsData(data || []);
        if (data && data.length > 0 && !selectedRep) {
          setSelectedRep(data[0].repId);
        }
      })
      .catch((err) => console.error("Failed to load slots:", err));
  }, [dateStr]);

  async function handleBookSlot() {
    if (!selectedRep || !selectedSlot) {
      setErrorMsg("Please select a sales expert and a time slot.");
      return;
    }

    if (!leadDetails.name || !leadDetails.phone) {
      setErrorMsg("Please provide client name and phone number.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/meetings/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId || `LEAD-PUBLIC-${Date.now().toString(36)}`,
          leadPhone: leadDetails.phone,
          dateStr,
          timeSlot: selectedSlot,
          repId: selectedRep,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book meeting");

      setBookingSuccess(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Quick next 7 days date pill tabs
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        display: "flex",
        justifyContent: "center",
        padding: "20px 16px 40px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Date Selector Header Pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none" }}>
          {upcomingDates.map((item) => {
            const isSelected = dateStr === item.iso;
            return (
              <button
                type="button"
                key={item.iso}
                onClick={() => { setDateStr(item.iso); setSelectedSlot(""); }}
                style={{
                  flexShrink: 0,
                  width: 56,
                  padding: "10px 0",
                  borderRadius: 16,
                  border: isSelected ? "none" : "1px solid #e2e8f0",
                  background: isSelected ? "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#475569",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 6px 16px rgba(99, 102, 241, 0.3)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", opacity: isSelected ? 0.9 : 0.6 }}>
                  {item.dayName}
                </span>
                <span style={{ fontSize: 18, fontWeight: 800, margin: "2px 0" }}>
                  {item.dayNum}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, opacity: isSelected ? 0.9 : 0.6 }}>
                  {item.month}
                </span>
              </button>
            );
          })}
        </div>

        {/* Header Illustration Card */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{ width: 40, height: 40, borderRadius: "50%", background: "#ffffff", border: "1px solid #e2e8f0", color: "#475569", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ‹
          </button>

          {/* Illustration Icon */}
          <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)", borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(129, 140, 248, 0.3)", color: "#ffffff" }}>
            <Calendar size={32} />
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>RealtyPulse</div>
          </div>
        </div>

        {/* Header Text */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", margin: "0 0 6px" }}>Book a Meeting</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
            Choose an expert and select a time that works for you.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 30, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: selectedSlot ? "#64748b" : "#4338ca" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#4338ca", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>1</div>
            <span>Select Expert</span>
          </div>
          <div style={{ color: "#cbd5e1" }}>──</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: selectedSlot ? 700 : 500, color: selectedSlot ? "#4338ca" : "#94a3b8" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: selectedSlot ? "#4338ca" : "#e2e8f0", color: selectedSlot ? "#ffffff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>2</div>
            <span>Select Time</span>
          </div>
          <div style={{ color: "#cbd5e1" }}>──</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: bookingSuccess ? 700 : 500, color: bookingSuccess ? "#4338ca" : "#94a3b8" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: bookingSuccess ? "#4338ca" : "#e2e8f0", color: bookingSuccess ? "#ffffff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>3</div>
            <span>Confirm</span>
          </div>
        </div>

        {bookingSuccess ? (
          /* Confirmation Success View */
          <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid #bbf7d0", boxShadow: "0 10px 30px rgba(34, 197, 94, 0.1)", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={36} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#166534", margin: "0 0 8px" }}>Consultation Confirmed!</h2>
            <p style={{ fontSize: 14, color: "#475569", margin: "0 0 20px" }}>
              Your appointment with <strong>{bookingSuccess.meeting?.assignedToName}</strong> has been reserved.
            </p>

            <div style={{ background: "#f8fafc", borderRadius: 14, padding: 16, textAlign: "left", display: "grid", gap: 10, fontSize: 13.5, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={15} color="#2563EB" /> <strong>Date:</strong> {dateStr}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={15} color="#D97706" /> <strong>Time Slot:</strong> {selectedSlot} ({formatSlotLabel(selectedSlot)})</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={15} color="#059669" /> <strong>Sales Consultant:</strong> {bookingSuccess.meeting?.assignedToName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={15} color="#7C3AED" /> <strong>Client Name:</strong> {leadDetails.name || "Client"}</div>
            </div>

            <button
              type="button"
              onClick={() => { setBookingSuccess(null); setSelectedSlot(""); }}
              style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 999, background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)", color: "#ffffff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
            >
              Book Another Meeting
            </button>
          </div>
        ) : (
          <div>
            {/* Sales Experts Section */}
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1e1b4b", marginBottom: 14 }}>Our Sales Experts</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {slotsData.map((rep) => {
                const isRepSelected = selectedRep === rep.repId;
                const repAvatar = rep.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";

                return (
                  <div
                    key={rep.repId}
                    style={{
                      background: "#ffffff",
                      borderRadius: 20,
                      padding: 16,
                      border: isRepSelected ? "2px solid #6366f1" : "1px solid #e2e8f0",
                      boxShadow: isRepSelected ? "0 8px 25px rgba(99, 102, 241, 0.15)" : "0 4px 15px rgba(0,0,0,0.03)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Top Row: Avatar + Info + Available Badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img
                          src={repAvatar}
                          alt={rep.repName}
                          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #e0e7ff" }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>{rep.repName}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{rep.repTitle}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                            <Star size={13} fill="#F59E0B" color="#F59E0B" /> {rep.rating || "4.9"} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({rep.reviewsCount || 100})</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: "#f3e8ff", color: "#7e22ce", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7" }}></span>
                        Available
                      </div>
                    </div>

                    {/* Bottom Row: Horizontal Scrollable Time Slots */}
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                      {(rep.slots || []).map((slot) => {
                        const isSlotSelected = isRepSelected && selectedSlot === slot.timeSlot;
                        const isAvail = slot.status === "available";

                        return (
                          <button
                            type="button"
                            key={slot.timeSlot}
                            disabled={!isAvail}
                            onClick={() => {
                              setSelectedRep(rep.repId);
                              setSelectedSlot(slot.timeSlot);
                              setErrorMsg("");
                            }}
                            style={{
                              flexShrink: 0,
                              padding: "10px 14px",
                              borderRadius: 12,
                              border: isSlotSelected ? "none" : "1px solid #e2e8f0",
                              background: isSlotSelected
                                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                : isAvail
                                ? "#f8fafc"
                                : "#f1f5f9",
                              color: isSlotSelected ? "#ffffff" : isAvail ? "#334155" : "#94a3b8",
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: isAvail ? "pointer" : "not-allowed",
                              boxShadow: isSlotSelected ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {slot.formattedTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={15} /> {errorMsg}
              </div>
            )}

            {/* Client Form & Confirm Booking Button */}
            {selectedSlot && (
              <div style={{ background: "#ffffff", borderRadius: 20, padding: 18, border: "1px solid #cbd5e1", marginBottom: 20, boxShadow: "0 6px 20px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b", marginBottom: 10 }}>Client Confirmation</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <input
                    placeholder="Your Full Name"
                    value={leadDetails.name}
                    onChange={(e) => setLeadDetails({ ...leadDetails, name: e.target.value })}
                    style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
                  />
                  <input
                    placeholder="WhatsApp Phone Number"
                    value={leadDetails.phone}
                    onChange={(e) => setLeadDetails({ ...leadDetails, phone: e.target.value })}
                    style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBookSlot}
                  disabled={loading}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: "14px",
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(67, 56, 202, 0.25)",
                  }}
                >
                  {loading ? "Reserving Slot..." : `Confirm Slot for ${formatSlotLabel(selectedSlot)}`}
                </button>
              </div>
            )}

            {/* Bottom Footer Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
                borderRadius: 20,
                padding: 16,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 8px 25px rgba(129, 140, 248, 0.25)",
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={22} color="#FFFFFF" />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>
                You can schedule a 1-on-1 call with our real estate expert.
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function formatSlotLabel(timeStr) {
  if (!timeStr) return "";
  const [h] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:00 ${period}`;
}
