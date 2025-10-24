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
  // 👉 catálogos
  const COLORS = [
    "🔵 Blue",
    "🔴 Red",
    "⚫ Black",
    "⚪ White",
    "🟢 Green",
    "🟡 Yellow",
    "🟣 Purple",
  ];
  const EMOJIS = ["🚗","🚙","🚕","🚘","🏎️","🚓","🚐","🚚","🚛"];
    

  // 👉 NUEVO: estado para color, emoji y datos del carro cargado
  const [color, setColor] = useState("#3b82f6"); // azul por defecto
  const [emoji, setEmoji] = useState("🚗");
  const [car, setCar] = useState(null);
  


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

  // 👉 NUEVO: cargar datos del carro si existe
  useEffect(() => {
    if (!ready || !exists) return;
    (async () => {
      try {
        const c = await api("/api/my-car", { method: "GET" });
        if (c && c.license_plate) setCar(c);
      } catch (e) {
        // si el backend aún no implementa GET, no rompemos el flujo
        console.warn("GET /api/my-car no disponible o fallo", e);
      }
    })();
  }, [ready, exists]);


  const allFilled = license.trim() && seats && brand && model && color && emoji;

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

    // body UNA vez
    const body = {
      license_plate: license.trim().toUpperCase(),
      seats: Number(seats),
      brand,
      model,
      color, // si tu backend no lo soporta aún, comenta esta línea
      emoji, // y esta también
    };

    // un solo POST
    await api("/api/my-car", { method: "POST", body });

    setExists(true);

    // intenta leer lo guardado
    try {
      const c = await api("/api/my-car", { method: "GET" });
      setCar(c || body);
    } catch {
      setCar(body);
    }

    alert("Car created successfully");
    navigate("/user");
  } catch (e) {
    console.error("POST /api/my-car failed:", e);
    if (String(e).includes("409")) alert("You already have too many cars");
    else alert("Failed to create car");
  } finally {
    setSaving(false);
  }
}

  
      // 👉 NUEVO: eliminar carro
      async function deleteCar() {
        if (!confirm("¿Eliminar tu carro? Esta acción no se puede deshacer.")) return;
        try {
          await api("/api/my-car", { method: "DELETE" });
          setExists(false);
          setCar(null);
          // opcional: limpiar form
          setLicense("");
          setSeats("4");
          setBrand("");
          setModel("");
          setColor("#3b82f6");
          setEmoji("🚗");
        } catch (e) {
          alert("No se pudo eliminar el carro");
    
        }
     }

  if (!ready) return <div style={S.loading}>Cargando…</div>;

  if (!ready) return <div style={S.loading}>Cargando…</div>;

return (
  <div style={S.page}>
    <div style={S.shell}>
      <header style={S.top}>
        <button style={S.brand} onClick={() => navigate("/dashboard")}>
          MoveTogether
        </button>
      </header>

      {/* Si ya existe un carro, mostramos su info */}
      {exists && car ? (
        <section style={S.carCard}>
          <h2 style={S.h2}>Your registered car</h2>
          <div style={S.carInfo}>
            <div style={S.carEmoji}>{car.emoji || "🚗"}</div>
            <div>
              <p><b>Plate:</b> {car.license_plate}</p>
              <p><b>Brand:</b> {car.brand}</p>
              <p><b>Model:</b> {car.model}</p>
              <p><b>Seats:</b> {car.seats}</p>
              <p><b>Color:</b> {car.color || "—"}</p>
            </div>
          </div>

          <button style={S.deleteBtn} onClick={deleteCar}>
            Delete car
          </button>
        </section>
      ) : (
        // Si no tiene carro, mostramos el formulario
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
              <select style={S.select} value={seats} onChange={(e) => setSeats(e.target.value)}>
                {["2","3","4","5","7"].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Brand</label>
              <select style={S.select} value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">Choose a brand</option>
                <option>Toyota</option>
                <option>Chevrolet</option>
                <option>Kia</option>
                <option>Renault</option>
                <option>Mazda</option>
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Color</label>
              <select style={S.select} value={color} onChange={(e) => setColor(e.target.value)}>
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Emoji</label>
              <select style={S.select} value={emoji} onChange={(e) => setEmoji(e.target.value)}>
                {EMOJIS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Model</label>
              <select style={S.select} value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="">Choose a model</option>
                <option>Corolla</option>
                <option>Prado</option>
                <option>Sandero</option>
                <option>Cerato</option>
                <option>Mazda 3</option>
              </select>
            </div>

            <button
              style={{ ...S.primary, opacity: allFilled && !saving ? 1 : 0.5 }}
              onClick={createCar}
              disabled={!allFilled || saving}
            >
              {saving ? "Saving..." : "Create car"}
            </button>
          </section>

          {/* PREVIEW */}
          <aside style={S.heroCard}>
            <div style={S.badgeCar}>{emoji}</div>
            <div style={S.heroTextBox}>
              <div style={S.heroTitle}>From campus to</div>
              <div style={S.heroTitle}>home, together.</div>
            </div>
          </aside>
        </div>
      )}
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
  carCard: {
  background: "#f9fafb",
  borderRadius: 12,
  padding: 24,
  display: "grid",
  gap: 12,
  maxWidth: 520,
  margin: "0 auto",
},
carInfo: {
  display: "flex",
  alignItems: "center",
  gap: 20,
  background: "#fff",
  border: "1px solid #e5e7eb",
  padding: 16,
  borderRadius: 10,
  boxShadow: "0 4px 10px rgba(0,0,0,.05)",
},
carEmoji: {
  fontSize: 50,
  filter: "drop-shadow(0 3px 6px rgba(0,0,0,.25))",
},
deleteBtn: {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 6,
},

  // --- tarjeta de info del carro ---
  infoCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, display: "grid", gap: 12 },
  infoHeader: { display: "flex", alignItems: "center", gap: 12 },
  infoEmoji: { fontSize: 42, lineHeight: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,.25))" },
  infoTitle: { fontWeight: 800, fontSize: 18, color: "#0f2230" },
  infoMuted: { color: "#6b7280", fontSize: 13 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  row: { display: "grid", gap: 2, background: "#f9fafb", padding: 10, borderRadius: 10, border: "1px solid #eef2f7" },
  rowLabel: { fontSize: 12, color: "#6b7280" },
  rowValue: { fontSize: 14, fontWeight: 700, color: "#111827" },

  delBtn: {
    height: 40, borderRadius: 10, border: "none",
    background: "#ef4444", color: "#fff", fontWeight: 700,
    cursor: "pointer", marginTop: 8
  },

};
