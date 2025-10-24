import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { api } from "../lib/api";



import bg from "../assets/Group27.png";
import ButtonBlack from "../components/ButtonBlack.jsx";
import ButtonOutline from "../components/ButtonOutline.jsx";
import ButtonGoogle from "../components/ButtonGoogle.jsx";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const loginEmail = async () => {
    setErr(""); setOk(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      setOk("Login exitoso");
      await delay(800);
      setOk("");
      navigate("/dashboard");
    } catch (e) {
      if (e.code === "auth/user-not-found") setErr("Usuario no encontrado");
      else if (e.code === "auth/wrong-password") setErr("Contraseña incorrecta");
      else setErr(e.message || "Error al iniciar sesión");
    } finally { setLoading(false); }
  };

  const goCreateUser = async () => {
    setErr(""); setOk(""); setLoading(true);
    try {
      const mail = email.trim();
      if (!mail) throw new Error("Ingresa un correo institucional");
      const methods = await fetchSignInMethodsForEmail(auth, mail);
      if (methods.length > 0) {
        const prov = methods.join(", ");
        throw new Error(`El correo ya está registrado vía: ${prov}. Inicia sesión.`);
      }
      navigate("/create-user", { state: { email: mail, from: "email" } });
    } catch (e) {
      setErr(e.message || "No se pudo verificar el correo");
    } finally { setLoading(false); }
  };

  const loginGoogle = async () => {
    setErr(""); setOk(""); setGLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const { user } = await signInWithPopup(auth, provider);
      const resp = await api("/api/ensure-user", { method: "POST", body: {} });
      if (resp.created === true) {
        const { uid, email, displayName, photoURL } = user;
        navigate("/create-user", { replace: true, state: { from: "google", uid, email, displayName, photoURL } });
      } else {
        navigate("/dashboard");
      }
    } catch (e) {
      if (e?.code !== "auth/popup-closed-by-user") setErr(e?.message || "Error con Google");
    } finally { setGLoading(false); }
  };

  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

  useEffect(() => {
    // Lee ambos: ?... y #...
    const qs = new URLSearchParams(window.location.search);
    const hs = new URLSearchParams(window.location.hash.slice(1));

    const mode = qs.get("mode") || hs.get("mode");
    const oob  = qs.get("oobCode") || hs.get("oobCode");

    // Evita bucles si ya estás en reset
    if (window.location.pathname === "/reset-password") return;

    if (mode === "resetPassword" && oob) {
      console.log("[Login] Detectado reset via", window.location.search ? "query" : "hash");
      navigate(`/reset-password?oobCode=${encodeURIComponent(oob)}`, { replace: true });
    }
  }, [navigate]);


  return (
    <div style={S.shell}>
      <div style={{ ...S.canvas, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", maxWidth: 1280, maxHeight: 832, width: "100%", height: "100%" }}>
        {/* IZQUIERDA - FORMULARIO */}
        <div style={{ ...S.leftPane, padding: isMobile ? 20 : 32 }}>
          <div style={{ ...S.formCard, width: isMobile ? "100%" : 420 }}>
            <h1 style={{ ...S.title, fontSize: isMobile ? 28 : 36 }}>Iniciar sesión</h1>

            <label style={S.label}>Correo</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="email"
              placeholder="correo@unisabana.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label style={S.label}>Contraseña</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />

            {err && <div style={S.error}>{err}</div>}
            {ok && <div style={S.success}>{ok}</div>}

            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <ButtonBlack onClick={loginEmail} disabled={loading || gLoading}>
                {loading ? "Cargando..." : "Entrar"}
              </ButtonBlack>

              <ButtonOutline onClick={goCreateUser} disabled={loading || gLoading}>
                Crear cuenta
              </ButtonOutline>

              <ButtonGoogle onClick={loginGoogle} disabled={loading || gLoading}>
                {gLoading ? "Conectando..." : "Continuar con Google"}
              </ButtonGoogle>
            </div>

            {/* Forgot password */}
            <button
              type="button"
              onClick={() => navigate("/recover-password")}
              style={S.forgot}
            >
              Forgot Your Password?
            </button>
          </div>
        </div>

        {/* DERECHA - IMAGEN */}
        {!isMobile && (
          <div style={S.rightPane}>
            <div style={{ ...S.hero, backgroundImage: `url(${bg})` }} />
            <div style={S.overlay} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------ ESTILOS ------------------ */
const S = {
  shell: { width: "100vw", height: "100vh", background: "#f5f6f8", display: "grid", placeItems: "center" },
  canvas: { position: "relative", borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 18px 50px rgba(0,0,0,0.12)", display: "grid" },
  leftPane: { display: "grid", placeItems: "center" },
  rightPane: { position: "relative" },
  hero: { position: "absolute", inset: 0, backgroundSize: "cover", backgroundPosition: "center" },
  overlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" },
  formCard: { display: "grid", gap: 12 },
  title: { margin: 0, fontWeight: 800, color: "#111" },
  label: { fontSize: 14, color: "#333", marginTop: 8 },
  input: { border: "1px solid #dedede", borderRadius: 10, padding: "0 14px", fontSize: 16, background: "#fff" },
  error: { background: "#ffeef0", color: "#b00020", padding: "10px 12px", borderRadius: 8, fontSize: 14 },
  success: { background: "#e6ffed", color: "#056f00", padding: "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600 },
  forgot: {
    marginTop: 10,
    background: "transparent",
    border: "none",
    padding: 0,
    color: "#0126B9",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    width: "fit-content",
  },
};
