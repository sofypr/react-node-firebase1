import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "../lib/api";

export default function MyCar() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);

  // Form state
  const [license, setLicense] = useState("");
  const [seats, setSeats] = useState("4");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  // Auth gate
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return navigate("/");
      try {
        const r = await api("/api/has-car", { method: "GET" });
        setExists(r.hasCar);
      } catch (e) {
        console.error("Error checking car:", e);
      } finally {
        setReady(true);
      }
    });
    return () => unsub();
  }, [navigate]);

  const allFilled = license.trim() && seats && brand && model;

  async function createCar() {
    try {
      setSaving(true);

      // Doble verificación antes de crear
      const chk = await api("/api/has-car", { method: "GET" });
      if (chk.hasCar) {
        alert("You already have too many cars");
        setExists(true);
        return;
      }

      await api("/api/my-car", {
        method: "POST",
        body: {
          license_plate: license.trim().toUpperCase(),
          seats: Number(seats),
          brand,
          model,
        },
      });

      setExists(true);
      alert("Car created successfully");
      navigate("/user");
    } catch (e) {
      if (String(e).includes("409")) alert("You already have too many cars");
      else alert("Failed to create car");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div style={S.loading}>Cargando…</div>;

  return (
    <div style={S.page}>
      <div style={S.shell}>
        <header style={S.top}>
          <button style={S.brand} onClick={() => navigate("/dashboard")}>
            MoveTogether
          </button>
        </header>

        <div style={S.grid}>
          {/* FORM */}
          <section style={S.panel}>
            <h2 style={S.h2}>Register a car</h2>

            {exists && (
              <div style={{ ...S.notice, background: "#FEF3C7", border: "1px solid #F59E0B" }}>
                You already have too many cars
              </div>
            )}

            <div style={S.field}>
              <label style={S.label}>License plate</label>
              <input
                style={S.input}
                placeholder="License plate"
                value={license}
                onChange={(e) => setLicense(e.target.value.toUpperCase())}
                disabled={exists}
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>Seats</label>
              <select style={S.select} value={seats} onChange={(e) => setSeats(e.target.value)} disabled={exists}>
                {["2","3","4","5","7"].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Car brand</label>
              <select style={S.select} value={brand} onChange={(e) => setBrand(e.target.value)} disabled={exists}>
                <option value="">Choose a brand</option>
                <option>Toyota</option>
                <option>Chevrolet</option>
                <option>Kia</option>
                <option>Renault</option>
                <option>Mazda</option>
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Car model</label>
              <select style={S.select} value={model} onChange={(e) => setModel(e.target.value)} disabled={exists}>
                <option value="">Choose a model</option>
                <option>Corolla</option>
                <option>Prado</option>
                <option>Sandero</option>
                <option>Cerato</option>
                <option>Mazda 3</option>
              </select>
            </div>

            <button
              style={{ ...S.primary, opacity: allFilled && !exists && !saving ? 1 : 0.5 }}
              onClick={createCar}
              disabled={!allFilled || exists || saving}
            >
              {saving ? "Saving..." : "Create car"}
            </button>
          </section>

          {/* PREVIEW */}
          <aside style={S.heroCard}>
            <div style={S.badgeCar}>🚗</div>
            <div style={S.heroTextBox}>
              <div style={S.heroTitle}>From campus to</div>
              <div style={S.heroTitle}>home, together.</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const S = {
  loading: { minHeight: "100vh", display: "grid", placeItems: "center" },
  page: { minHeight: "100vh", background: "#f3f4f6", padding: 24 },
  shell: { maxWidth: 1140, margin: "0 auto", background: "#fff", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.12)", padding: 24 },
  top: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  brand: { background: "none", border: "none", fontWeight: 800, fontSize: 18, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  panel: { background: "#f9fafb", borderRadius: 12, padding: 20, display: "grid", gap: 12, alignContent: "start" },
  h2: { fontSize: 24, fontWeight: 800, marginBottom: 4 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, color: "#6b7280" },
  input: { height: 36, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 10px", outline: "none" },
  select: { height: 36, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 8px", background: "#fff" },
  primary: { height: 40, borderRadius: 10, border: "none", background: "#0b5fff", color: "#fff", fontWeight: 700, cursor: "pointer", marginTop: 6 },
  heroCard: {
    position: "relative",
    borderRadius: 16,
    minHeight: 420,
    background: "linear-gradient(160deg,#0f2230 30%,#e8dfc9 30% 70%,#0f2230 0)",
    boxShadow: "0 18px 60px rgba(0,0,0,.2)",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
  },
  badgeCar: { position: "absolute", top: 60, right: 120, fontSize: 56, filter: "drop-shadow(0 6px 12px rgba(0,0,0,.35))" },
  heroTextBox: { position: "absolute", bottom: 28, left: 28, background: "rgba(255,255,255,.25)", backdropFilter: "blur(6px)", borderRadius: 12, padding: "14px 16px" },
  heroTitle: { fontSize: 22, fontWeight: 700, color: "#ffffff" },
  notice: { borderRadius: 8, padding: "10px 12px", fontSize: 14, marginBottom: 8 },
};
