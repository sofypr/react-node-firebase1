// client/src/pages/CreateUser.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, storage } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { api } from "../lib/api";

import bgUser from "../assets/bgUser.png";
import iconUser from "../assets/iconUser.png";
import ButtonBlack from "../components/ButtonBlack.jsx";
import SelectPhotoButton from "../components/SelectPhotoButton.jsx";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
// Celular Colombia
const CO_CELL_RE = /^(?:\+57\s*)?(3\d{2})[\s-]?(\d{3})[\s-]?(\d{4})$/;


export default function CreateUser() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};
  const isGoogle = state?.from === "google";

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width:768px)").matches
  );

  const prefill = useMemo(() => {
    const dn = state?.displayName || "";
    const parts = dn.trim().split(/\s+/);
    return {
      email: state?.email || "",
      first: parts[0] || "",
      last: parts.slice(1).join(" ") || "",
      photoURL: state?.photoURL || null,
    };
  }, [state]);

  // Form
  const [first_name, setFirst] = useState(prefill.first);
  const [last_name, setLast] = useState(prefill.last);
  const [email, setEmail] = useState(prefill.email);
  const [pass, setPass] = useState("");
  const [phone, setPhone] = useState("");
  const [universityCode, setUniversityCode] = useState(""); // se guardará como user_id
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(prefill.photoURL || null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const m = window.matchMedia("(max-width:768px)");
    const on = (e) => setIsMobile(e.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (isGoogle && !auth.currentUser) navigate("/", { replace: true });
  }, [isGoogle, navigate]);

  const handleSelect = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  async function cleanupGoogleAccount() {
    try { if (auth.currentUser) await deleteUser(auth.currentUser); } catch {"Error"}
  }

  async function handleCancel() {
    if (isGoogle) await cleanupGoogleAccount();
    navigate("/", { replace: true });
  }

  function validateClient({ first_name, last_name, phone, uid, isGoogle, email, pass, universityCode }) {
    if (!universityCode?.trim()) return "El código de la universidad es obligatorio.";
    if (!first_name?.trim()) return "El nombre no puede ser nulo.";
    if (!last_name?.trim())  return "El apellido no puede ser nulo.";
    if (!phone?.trim())      return "El teléfono celular es obligatorio.";
    if (!CO_CELL_RE.test(phone.trim())) return "Celular inválido (Colombia). Debe iniciar en 3 y tener 10 dígitos. Puede incluir +57.";
    if (!uid)                return "ID de usuario inválido. Inicia sesión nuevamente.";
    if (!isGoogle) {
      if (!email?.trim())   return "El correo es obligatorio.";
      if (!pass)            return "La contraseña es obligatoria.";
    }
    return null;
  }

  function normalizePhoneCO(p) {
    const m = p.trim().match(CO_CELL_RE);
    return m ? `+57${m[1]}${m[2]}${m[3]}` : p.trim();
  }

  async function handleSubmit() {
    setErr(""); setOk("");
    setLoading(true);
    let createdAuth = false;

    try {
      let uid = auth.currentUser?.uid || null;
      let mail = (email || "").trim();

      // Prevalidación básica antes de crear Auth por correo
      const preErrBasic =
        !universityCode?.trim() ? "El código de la universidad es obligatorio." :
        !first_name?.trim() ? "El nombre no puede ser nulo." :
        !last_name?.trim() ? "El apellido no puede ser nulo." :
        !phone?.trim() ? "El teléfono celular es obligatorio." :
        !CO_CELL_RE.test(phone.trim()) ? "Celular inválido (Colombia)." :
        (!isGoogle && !mail) ? "El correo es obligatorio." :
        (!isGoogle && !pass) ? "La contraseña es obligatoria." :
        null;
      if (preErrBasic) throw new Error(preErrBasic);

      if (!isGoogle) {
        const methods = await fetchSignInMethodsForEmail(auth, mail);
        if (methods.length > 0) throw new Error("Ese correo ya está registrado. Inicia sesión.");
        const cred = await createUserWithEmailAndPassword(auth, mail, pass);
        uid = cred.user.uid;
        mail = cred.user.email || mail;
        createdAuth = true;
      } else {
        if (!uid) throw new Error("Sesión de Google inválida.");
        mail = auth.currentUser.email || mail;
      }

      // Validación final con UID real
      const vErr = validateClient({
        first_name, last_name, phone, uid, isGoogle, email: mail, pass, universityCode
      });
      if (vErr) {
        if (isGoogle) await cleanupGoogleAccount();
        throw new Error(vErr);
      }

      const base = {
        first_name: first_name.trim(),
        last_name:  last_name.trim(),
        user_id:    universityCode.trim(), // guarda el código como user_id
        email:      mail,
        phone:      normalizePhoneCO(phone),
        user_photo: null,
      };

      await api("/api/register", { method: "POST", body: base });

      // Foto opcional
      if (file) {
        try {
          const r = ref(storage, `users/${uid}/profile.jpg`);
          await uploadBytes(r, file);
          const url = await getDownloadURL(r);
          await api("/api/register", { method: "POST", body: { ...base, user_photo: url } });
        } catch {"Error"}
      } else if (prefill.photoURL) {
        await api("/api/register", { method: "POST", body: { ...base, user_photo: prefill.photoURL } });
      }

      setOk("Usuario creado correctamente");
      await delay(900);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      try {
        if (createdAuth && auth.currentUser) await deleteUser(auth.currentUser);
      } catch {"Error"}
      setErr(e?.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.container}>
      <div style={{ ...S.card, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
        <div style={S.left}>
          <h1 style={S.title}>Crear usuario</h1>

          <label style={S.label}>Código de la universidad</label>
          <input
            style={S.input}
            value={universityCode}
            onChange={(e) => setUniversityCode(e.target.value)}
            placeholder="Código institucional"
            required
          />

          <label style={S.label}>Nombre</label>
          <input
            style={S.input}
            value={first_name}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="Tu nombre"
            required
          />

          <label style={S.label}>Apellido</label>
          <input
            style={S.input}
            value={last_name}
            onChange={(e) => setLast(e.target.value)}
            placeholder="Apellido"
            required
          />

          <label style={S.label}>Correo</label>
          <input
            style={S.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@unisabana.edu.co"
            type="email"
            disabled={isGoogle}
            required={!isGoogle}
          />

          {!isGoogle && (
            <>
              <label style={S.label}>Contraseña</label>
              <input
                style={S.input}
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
              />
            </>
          )}

          <label style={S.label}>Teléfono celular (Colombia)</label>
          <input
            style={S.input}
            type="tel"
            inputMode="numeric"
            pattern="^(\+57\s*)?(3\d{2})[\s-]?(\d{3})[\s-]?(\d{4})$"
            title="10 dígitos iniciando en 3. Puede incluir +57."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 3xx xxx xxxx"
            required
          />

          {err && <div style={S.error}>{err}</div>}
          {ok && <div style={S.ok}>{ok}</div>}

          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <ButtonBlack onClick={handleSubmit} disabled={loading}>
              {loading ? "Creando..." : "Confirmar"}
            </ButtonBlack>
            <button type="button" onClick={handleCancel} style={S.backBtn}>
              Cancelar
            </button>
          </div>
        </div>

        {!isMobile && (
          <div style={S.right}>
            <div style={{ ...S.bg, backgroundImage: `url(${bgUser})` }}>
              <div style={S.userSection}>
                <img src={preview || iconUser} alt="avatar" style={S.avatar} />
                <SelectPhotoButton onSelect={handleSelect} />
                <p style={S.tagline}>From campus to home, together.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- ESTILOS ---------- */
const S = {
  container: {
    width: "100vw",
    minHeight: "100vh",
    background: "#f5f6f8",
    display: "grid",
    placeItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 1100,
    display: "grid",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 15px 45px rgba(0,0,0,0.1)",
  },
  left: { padding: "40px 60px", display: "grid", gap: 10, alignContent: "start" },
  right: { position: "relative" },
  bg: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "grid",
    placeItems: "center",
  },
  userSection: { display: "grid", gap: 12, justifyItems: "center" },
  avatar: {
    width: 100, height: 100, borderRadius: "50%", objectFit: "cover",
    border: "2px solid #fff", boxShadow: "0 0 8px rgba(0,0,0,0.2)",
  },
  tagline: {
    marginTop: 50, padding: "12px 18px", background: "rgba(255,255,255,0.15)",
    borderRadius: 12, color: "#fff", fontSize: 16, textAlign: "center", backdropFilter: "blur(5px)",
  },
  title: { fontSize: 36, fontWeight: 800, color: "#111", marginBottom: 6 },
  label: { fontSize: 14, color: "#333", marginTop: 6 },
  input: { height: 44, border: "1px solid #ccc", borderRadius: 8, padding: "0 14px", fontSize: 15, background: "#fff" },
  error: { background: "#ffeef0", color: "#b00020", padding: "10px 12px", borderRadius: 8, fontSize: 14 },
  ok: { background: "#e6ffed", color: "#056f00", padding: "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600 },
  backBtn: {
    height: 42, width: "100%", borderRadius: 10, background: "#fff",
    border: "2px solid #000", color: "#000", fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
};
