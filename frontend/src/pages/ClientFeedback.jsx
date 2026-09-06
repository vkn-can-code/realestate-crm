import { useState, useEffect } from "react";
import { CheckCircle2, Star } from "lucide-react";

export default function ClientFeedback() {
  const [config, setConfig] = useState(null);
  const [rating, setRating] = useState(5);
  const [answers, setAnswers] = useState({});
  const [clientName, setClientName] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/feedback/config")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error("Failed to load feedback config:", err));
  }, []);

  const handleAnswerChange = (qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName || "Anonymous Client",
          rating,
          answers,
          comments,
        }),
      });
      if (res.ok) {
        setIsSubmitted(true);
      }
    } catch (err) {
      alert("Failed to submit feedback. Please try again.");
    }
  };

  if (isSubmitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1d", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, maxWidth: 500, width: "100%", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <CheckCircle2 size={54} color="#3fb950" />
          </div>
          <h2 style={{ fontSize: 24, color: "#3fb950", marginBottom: 12 }}>Thank You For Your Feedback!</h2>
          <p style={{ color: "#a0aec0", fontSize: 14, lineHeight: 1.6 }}>
            Your response has been received by our sales management team. We appreciate your time and look forward to serving your real estate needs!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1d", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, maxWidth: 560, width: "100%" }}>
        {/* BRANDING HEADER */}
        <div style={{ textAlign: "center", marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
          <h1 style={{ fontSize: 20, color: "#3182ce", margin: 0, fontWeight: "bold" }}>REALTYPULSE REAL ESTATE AGENCY</h1>
          <p style={{ fontSize: 13, color: "#cbd5e0", marginTop: 4 }}>{config?.title || "Client Satisfaction Survey"}</p>
        </div>

        <p style={{ fontSize: 13, color: "#a0aec0", marginBottom: 20, textAlign: "center" }}>
          {config?.subtitle || "Please rate your experience with our real estate consultation team."}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: "#cbd5e0", marginBottom: 6 }}>Your Name (Optional)</label>
            <input
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff" }}
              placeholder="e.g. Adwayth"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          {/* STAR RATING PICKER */}
          <div style={{ marginBottom: 20, textAlign: "center" }}>
            <label style={{ display: "block", fontSize: 14, color: "#ffffff", fontWeight: "bold", marginBottom: 8 }}>
              Overall Satisfaction Rating
            </label>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, cursor: "pointer" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  onClick={() => setRating(star)}
                  fill={star <= rating ? "#f6e05e" : "transparent"}
                  color={star <= rating ? "#f6e05e" : "#4a5568"}
                  style={{ transition: "all 0.2s" }}
                />
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 6 }}>{rating} out of 5 Stars</div>
          </div>

          {/* DYNAMIC QUESTIONS */}
          {(config?.questions || []).map((q) => (
            <div key={q.id} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: "#cbd5e0", marginBottom: 6 }}>{q.text}</label>
              {q.type === "text" ? (
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff" }}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              ) : (
                <select
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "#1a202c", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff" }}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                >
                  <option value="">Select an option...</option>
                  {(q.options || []).map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, color: "#cbd5e0", marginBottom: 6 }}>Additional Comments</label>
            <textarea
              rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff" }}
              placeholder="Tell us what went well or how we can improve..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <button
            type="submit"
            style={{ width: "100%", padding: "12px", borderRadius: 999, background: "#3182ce", color: "#ffffff", border: "none", fontWeight: "bold", fontSize: 15, cursor: "pointer" }}
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
