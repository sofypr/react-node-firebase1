// src/App.jsx
import { useEffect, useState } from "react";
import { auth, db } from "./lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { api } from "./lib/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Email/password
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => off();
  }, []);

  // ---------- Auth ----------
  const isUni = (e) => /@unisabana\.edu\.co$/i.test(e || "");

  const loginGoogle = async () => {
    setLoading(true);
    setErr("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (e) {
      setErr(e?.message || "Error login Google");
    } finally {
      setLoading(false);
    }
  };

  const registerEmail = async () => {
    setErr("");
    if (!isUni(email)) return setErr("Solo correos @unisabana.edu.co");
    await createUserWithEmailAndPassword(auth, email.trim(), pass);
  };

  const loginEmail = async () => {
    setErr("");
    if (!isUni(email)) return setErr("Solo correos @unisabana.edu.co");
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const logout = () => signOut(auth);

  // ---------- Firestore directo (cliente) ----------
  const addLocal = async () => {
    await addDoc(collection(db, "items"), {
      name: "Demo local",
      createdAt: serverTimestamp(),
      uid: user.uid,
    });
    alert("Añadido en Firestore (cliente)");
  };

  const loadLocal = async () => {
    const snap = await getDocs(collection(db, "items"));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log("Local items:", items);
    alert(`Local items: ${items.length} (ver consola)`);
  };

  // ---------- Backend Express (API) ----------
  const ping = async () => {
    const r = await fetch("http://localhost:4000/api/ping").then((r) => r.json());
    alert(JSON.stringify(r));
  };

  const addFromApi = async () => {
    const r = await api("/api/items", {
      method: "POST",
      body: JSON.stringify({ name: "Desde backend" }),
    });
    console.log("API creado:", r);
    alert("Añadido vía API");
  };

  const listFromApi = async () => {
    const r = await api("/api/items");
    console.log("API items:", r);
    alert(`API items: ${r.length} (ver consola)`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 900 }}>
      <h1 style={{ fontSize: 56, margin: "0 0 16px" }}>🔥 Firebase + Node Backend</h1>

      {err && (
        <pre style={{ color: "#b00020", background: "#fee", padding: 12, borderRadius: 6 }}>
          {err}
        </pre>
      )}

      {user ? (
        <>
          <p style={{ margin: "12px 0" }}>
            ✅ Conectado como: <strong>{user.email}</strong>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button style={btn} onClick={logout}>Salir</button>
            <button style={btn} onClick={addLocal}>Añadir Firestore</button>
            <button style={btn} onClick={loadLocal}>Cargar Firestore</button>
            <button style={btn} onClick={ping}>Ping API</button>
            <button style={btn} onClick={addFromApi}>Añadir vía API</button>
            <button style={btn} onClick={listFromApi}>Listar vía API</button>
          </div>
        </>
      ) : (
        <>
          <h3>Iniciar sesión</h3>
          <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
            <input
              placeholder="correo@unisabana.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />
            <input
              placeholder="Contraseña"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              style={input}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={btn} onClick={loginEmail}>Entrar</button>
              <button style={btn} onClick={registerEmail}>Registrar</button>
              <button style={btn} onClick={loginGoogle} disabled={loading}>
                {loading ? "Abriendo…" : "Login con Google"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const btn = {
  padding: "10px 18px",
  fontSize: 14,
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

const input = {
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid #ccc",
  borderRadius: 6,
};
