import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";
import { Building, Home, Key, DollarSign, Store, Edit, MapPin, User, CheckCircle2, ImagePlus, Plus, UploadCloud, X, Search } from "lucide-react";

const emptyForm = { title: "", location: "", price: "", type: "Apartment", bedrooms: "", area: "", description: "", listingIntent: "buy", images: [] };

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  function refresh() {
    api.get("/properties").then(setProperties);
  }

  useEffect(refresh, []);

  // Handle local PC file upload for Add Form
  function handleLocalFileUpload(e, isEdit = false) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        if (isEdit) {
          setEditingProperty((prev) => {
            const currentImgs = Array.isArray(prev.images)
              ? [...prev.images]
              : typeof prev.images === "string"
              ? prev.images.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            return { ...prev, images: [...currentImgs, base64Url] };
          });
        } else {
          setForm((prev) => {
            const currentImgs = Array.isArray(prev.images)
              ? [...prev.images]
              : typeof prev.images === "string"
              ? prev.images.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            return { ...prev, images: [...currentImgs, base64Url] };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImageFromForm(indexToRemove, isEdit = false) {
    if (isEdit) {
      setEditingProperty((prev) => {
        const currentImgs = Array.isArray(prev.images)
          ? [...prev.images]
          : typeof prev.images === "string"
          ? prev.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        return { ...prev, images: currentImgs.filter((_, idx) => idx !== indexToRemove) };
      });
    } else {
      setForm((prev) => {
        const currentImgs = Array.isArray(prev.images)
          ? [...prev.images]
          : typeof prev.images === "string"
          ? prev.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        return { ...prev, images: currentImgs.filter((_, idx) => idx !== indexToRemove) };
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const imagesArr = Array.isArray(form.images) ? form.images : [];
      await api.post("/properties", {
        ...form,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        images: imagesArr,
      });
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    } catch (err) {
      alert("Error saving property: " + err.message);
      console.error(err);
    }
  }

  async function handleApprove(id) {
    await api.patch(`/properties/${id}/approve`, { status: "Available", approvalStatus: "Approved" });
    refresh();
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingProperty) return;
    const imagesArr = Array.isArray(editingProperty.images)
      ? editingProperty.images
      : typeof editingProperty.images === "string"
      ? editingProperty.images.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    await api.put(`/properties/${editingProperty.id}`, {
      ...editingProperty,
      images: imagesArr,
    });
    setEditingProperty(null);
    refresh();
  }

  const filteredProperties = properties.filter((p) => {
    if (activeTab !== "all" && p.listingIntent !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = p.title?.toLowerCase().includes(q);
      const matchesLocation = p.location?.toLowerCase().includes(q);
      const matchesType = p.type?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesLocation && !matchesType) return false;
    }
    return true;
  });

  return (
    <>
      <Topbar
        title="Property Database"
        subtitle="Manage agency listings and client-submitted properties (Buy, Rent In, Sell, Rent Out)."
        actions={
          <button className="cylinder-action-btn active" onClick={() => setShowForm((s) => !s)}>
            <Plus size={15} /> {showForm ? "Cancel" : "Add Agency Property"}
          </button>
        }
      />

      <div style={{ display: "flex", gap: 14, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 999, padding: "8px 16px", minWidth: 280 }}>
          <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
          <input 
            type="text" 
            placeholder="Search properties by title, location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: 14, color: "#0F172A" }}
          />
        </div>
      </div>

      {/* 5 Category Filter Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          className={`btn ${activeTab === "all" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 999 }}
          onClick={() => setActiveTab("all")}
        >
          <Building size={14} /> All Properties ({properties.length})
        </button>
        <button
          className={`btn ${activeTab === "buy" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 999 }}
          onClick={() => setActiveTab("buy")}
        >
          <Home size={14} /> For Sale (Buy Inventory) ({properties.filter((p) => p.listingIntent === "buy" || p.listingIntent === "to_sell").length})
        </button>
        <button
          className={`btn ${activeTab === "rent_in" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 999 }}
          onClick={() => setActiveTab("rent_in")}
        >
          <Key size={14} /> For Rent (Rent In Inventory) ({properties.filter((p) => p.listingIntent === "rent_in" || p.listingIntent === "to_rent").length})
        </button>
        <button
          className={`btn ${activeTab === "sell" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 999 }}
          onClick={() => setActiveTab("sell")}
        >
          <DollarSign size={14} /> Client Submissions — Sell ({properties.filter((p) => p.listingIntent === "sell").length})
        </button>
        <button
          className={`btn ${activeTab === "rent_out" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 999 }}
          onClick={() => setActiveTab("rent_out")}
        >
          <Store size={14} /> Client Submissions — Rent Out ({properties.filter((p) => p.listingIntent === "rent_out").length})
        </button>
      </div>

      {/* Add Agency Property Form Modal */}
      {showForm && (
        <form className="glass-card" style={{ marginBottom: 20, padding: 20 }} onSubmit={handleSubmit}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={18} /> Add New Agency Property Listing
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label className="field-label">Listing Intent / Category</label>
              <select value={form.listingIntent} onChange={(e) => setForm({ ...form, listingIntent: e.target.value })}>
                <option value="to_sell">Property For Sale (To Sell)</option>
                <option value="to_rent">Property For Rent (To Rent Out)</option>
                <option value="client_buy">Customer Needs To Buy</option>
                <option value="client_rent">Customer Needs To Rent</option>
              </select>
            </div>
            <div>
              <label className="field-label">Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kakkanad Luxury Villa" />
            </div>
            <div>
              <label className="field-label">Location *</label>
              <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Kakkanad, Kochi" />
            </div>
            <div>
              <label className="field-label">Price (₹) *</label>
              <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="7500000" />
            </div>
            <div>
              <label className="field-label">Bedrooms (BHK)</label>
              <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="3" />
            </div>
            <div>
              <label className="field-label">Sqft Area</label>
              <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. 1850 sqft" />
            </div>
            <div>
              <label className="field-label">Property Type</label>
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Villa / Apartment" />
            </div>
          </div>

          {/* PC Local File Upload Zone */}
          <div style={{ background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 16, padding: 18, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Upload Property Photos from Computer / PC</div>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 12px 0" }}>Select JPEG, PNG, or WebP photo files directly from your computer device.</p>
            
            <label className="btn btn-primary" style={{ borderRadius: 999, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <UploadCloud size={16} /> Choose Image Files from PC
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleLocalFileUpload(e, false)}
              />
            </label>

            {/* Thumbnail Previews */}
            {Array.isArray(form.images) && form.images.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                {form.images.map((imgSrc, idx) => (
                  <div key={idx} style={{ position: "relative", width: 80, height: 60, borderRadius: 8, overflow: "hidden", border: "1px solid #CBD5E1" }}>
                    <img src={imgSrc} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeImageFromForm(idx, false)}
                      style={{ position: "absolute", top: 2, right: 2, background: "rgba(15,23,42,0.75)", color: "#FFF", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary" style={{ borderRadius: 999 }} type="submit">
            Save Property Listing
          </button>
        </form>
      )}

      {/* Edit Property Media Modal */}
      {editingProperty && (
        <form className="glass-card" style={{ marginBottom: 20, padding: 20 }} onSubmit={handleSaveEdit}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <Edit size={18} /> Edit Property & Photos for ID: {editingProperty.id}
          </div>

          {/* PC Local File Upload Zone for Edit */}
          <div style={{ background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 16, padding: 18, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Upload Photos from Computer / PC</div>
            <label className="btn btn-primary" style={{ borderRadius: 999, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 12 }}>
              <UploadCloud size={16} /> Choose Image Files from PC
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleLocalFileUpload(e, true)}
              />
            </label>

            {/* Thumbnail Previews for Edit */}
            {Array.isArray(editingProperty.images) && editingProperty.images.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {editingProperty.images.map((imgSrc, idx) => (
                  <div key={idx} style={{ position: "relative", width: 90, height: 65, borderRadius: 8, overflow: "hidden", border: "1px solid #CBD5E1" }}>
                    <img src={imgSrc} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeImageFromForm(idx, true)}
                      style={{ position: "absolute", top: 2, right: 2, background: "rgba(220,38,38,0.85)", color: "#FFF", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" style={{ borderRadius: 999 }} type="submit">Save Media Updates</button>
            <button className="btn btn-secondary" style={{ borderRadius: 999 }} type="button" onClick={() => setEditingProperty(null)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Property Cards Grid */}
      <div className="property-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {filteredProperties.map((p) => {
          const hasImage = p.images && p.images.length > 0 && Boolean(p.images[0]);

          return (
            <div key={p.id} className="glass-card property-card" style={{ padding: 18, borderRadius: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="pill pill-violet">
                  {p.listingIntent === "buy" || p.listingIntent === "to_sell" ? "For Sale" : p.listingIntent === "rent_in" || p.listingIntent === "to_rent" ? "For Rent" : p.listingIntent === "sell" ? "Client Submission (Sell)" : "Client Submission (Rent Out)"}
                </span>
                <span className={`pill ${p.approvalStatus === "Approved" ? "pill-success" : "pill-warning"}`}>
                  {p.approvalStatus || "Approved"}
                </span>
              </div>

              {/* Show photo ONLY if user actually uploaded an image */}
              {hasImage && (
                <img src={p.images[0]} alt={p.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 12 }} />
              )}

              <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={13} /> {p.location} · {p.bedrooms ? `${p.bedrooms} BHK · ` : ""}{p.area}
              </div>

              <div style={{ fontSize: 18, fontWeight: 800, color: "#1D4ED8", marginTop: 8 }}>
                ₹{Number(p.price).toLocaleString("en-IN")}{p.listingIntent === "rent_in" || p.listingIntent === "rent_out" || p.listingIntent === "to_rent" ? " / mo" : ""}
              </div>

              {p.clientSubmission && (
                <div style={{ marginTop: 12, padding: 12, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12.5 }}>
                  <div style={{ fontWeight: 700, color: "#D97706", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <User size={13} /> Client Contact Details:
                  </div>
                  <div style={{ color: "#0F172A" }}>Name: {p.clientSubmission.clientName}</div>
                  <div style={{ color: "#0F172A" }}>Phone: {p.clientSubmission.clientPhone}</div>
                  {p.clientSubmission.askingPrice && <div>Asking Price: {p.clientSubmission.askingPrice}</div>}
                  {p.clientSubmission.expectedRent && <div>Expected Rent: {p.clientSubmission.expectedRent}</div>}
                  {p.clientSubmission.securityDeposit && <div>Security Deposit: {p.clientSubmission.securityDeposit}</div>}
                  <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>Channel: {p.clientSubmission.channel}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {p.approvalStatus === "Pending" && (
                  <button className="btn btn-primary" style={{ flex: 1, borderRadius: 999 }} onClick={() => handleApprove(p.id)}>
                    <CheckCircle2 size={14} /> Approve Listing
                  </button>
                )}
                <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 999 }} onClick={() => setEditingProperty(p)}>
                  <ImagePlus size={14} /> Upload / Edit Media
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
