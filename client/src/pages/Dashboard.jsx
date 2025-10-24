// client/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "../lib/api";

import ButtonBlack from "../components/ButtonBlack.jsx";
import ButtonOutline from "../components/ButtonOutline.jsx";
import bg from "../assets/Group27.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("User");
  const [photo, setPhoto] = useState("");

  // form
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const [date, setDate] = useState(today);
  const [hour, setHour] = useState(now);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/"); return; }
      try {
        const me = await api("/api/me", { method: "GET" });
        const first = (me.first_name || "").trim();
        const last = (me.last_name || "").trim();
        const full = (first || last) ? `${first} ${last}`.trim()
          : (me.email ? me.email.split("@")[0] : "User");
        setName(full);
        setPhoto(me.user_photo || "");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  const submitSearch = () => {
    console.log({ from, to, date, hour });
  };

  if (loading) return <div style={S.loading}>Cargando…</div>;

  return (
    <div style={S.wrap}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.brand}>MoveTogether</div>
        <div style={S.user}>
          {photo ? (
            <img src={photo} alt="avatar" style={S.userImg} />
          ) : (
            <div style={S.userIcon}>👤</div>
          )}
          <button
            style={S.userBtn}
            onClick={() => navigate("/user")}
            title="Ir a tu perfil"
          >
            {name}
          </button>
        </div>

      </header>

      {/* Body */}
      <main style={S.main}>
        {/* Left column */}
        <section style={S.left}>
          <h1 style={S.h1}>Ride together,<br />study together.</h1>

          <div style={S.form}>
            <div style={S.inputRow}>
              <input
                style={S.input}
                placeholder="From"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span style={S.paperPlane}>📨</span>
            </div>

            <input
              style={S.input}
              placeholder="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />

            <div style={S.twoCols}>
              <div style={S.col}>
                <label style={S.label}>Date</label>
                <input
                  type="date"
                  style={S.input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div style={S.col}>
                <label style={S.label}>Hour</label>
                <input
                  type="time"
                  style={S.input}
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                />
              </div>
            </div>

            <div style={S.btns}>
              <ButtonBlack onClick={submitSearch}>Wheels me</ButtonBlack>
              <ButtonOutline onClick={() => navigate("/trips")}>My trips</ButtonOutline>
            </div>
          </div>
        </section>

        {/* Right column */}
        <section style={S.right}>
          <div style={{ ...S.heroImg, backgroundImage: `url(${bg})` }} />
        </section>
      </main>
    </div>
  );
}

/* ---------- styles ---------- */
const S = {
  wrap: { minHeight: "100vh", background: "#f4f6f8", display: "grid", gridTemplateRows: "64px 1fr" },
  header: {
    background: "#0f2230", color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "0 20px",
  },
  brand: { fontWeight: 800, fontSize: 18 },
  user: { display: "flex", alignItems: "center", gap: 10, color: "#fff" },
  userImg: {
    width: 28,
    height: 28,
    borderRadius: 999,
    objectFit: "cover",
    display: "block",
    border: "1px solid rgba(255,255,255,.35)",
  },

  userIcon: {
    width: 28, height: 28, borderRadius: 999, objectFit: "cover", display: "block",
    border:  "1px solid rgba(255,255,255,.35)",
  },
  userBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,.3)",
    color: "#fff",
    borderRadius: 10,
    padding: "6px 12px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  main: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    padding: 24,
    alignItems: "center",
  },

  left: { maxWidth: 620, justifySelf: "center" },
  // Texto más grande
  h1: { margin: 0, fontSize: 64, lineHeight: 1.08, color: "#0f2230", fontWeight: 900 },

  form: { display: "grid", gap: 12, marginTop: 18, maxWidth: 520 },
  inputRow: { position: "relative" },
  input: {
    width: "100%",
    height: 46,
    border: "1px solid #d8dde3",
    borderRadius: 10,
    padding: "0 14px",
    fontSize: 16,
    background: "#eef1f4",
    outline: "none",
  },
  paperPlane: { position: "absolute", right: 10, top: 10, fontSize: 20, opacity: 0.6 },

  twoCols: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 },
  col: { display: "grid", gap: 6 },
  label: { fontSize: 12, color: "#4a5561" },

  btns: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 },

  right: { justifySelf: "center" },
  heroImg: {
    width: 480, height: 480, borderRadius: 14, backgroundSize: "cover", backgroundPosition: "center",
    boxShadow: "0 12px 28px rgba(0,0,0,.12)",
  },

  loading: { minHeight: "100vh", display: "grid", placeItems: "center", color: "#333", fontWeight: 600 },
};
