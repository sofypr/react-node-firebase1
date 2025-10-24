
import { useEffect, useState } from "react";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { Link } from "react-router-dom";
import groupImg from "../assets/Group27.png";

function getOobFromUrl() {
  const qs = new URLSearchParams(window.location.search);
  const hs = new URLSearchParams(window.location.hash.slice(1));
  return qs.get("oobCode") || hs.get("oobCode");
}

export default function ResetPassword() {
  const auth = getAuth();

  const [verifying, setVerifying] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [oobCode, setOobCode] = useState(null);

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  // Leer oobCode (query o hash) y verificarlo
  useEffect(() => {
    const code = getOobFromUrl();
    setOobCode(code);

    (async () => {
      setVerifying(true);
      try {
        if (!code) throw { code: "missing-oob" };
        const email = await verifyPasswordResetCode(auth, code);
        setVerifiedEmail(email);
      } catch (e) {
        console.error("verify error:", e.code || e.message);
        if (e.code === "auth/expired-action-code") {
          setErr("El enlace ha expirado. Solicita uno nuevo.");
        } else if (e.code === "auth/invalid-action-code" || e.code === "missing-oob") {
          setErr("El enlace no es válido. Abre de nuevo el correo de recuperación.");
        } else {
          setErr("No pudimos validar el enlace. Intenta de nuevo.");
        }
      } finally {
        setVerifying(false);
      }
    })();
  }, [auth]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);

    if (!pwd || pwd.length < 6) return setErr("La nueva contraseña debe tener al menos 6 caracteres.");
    if (pwd !== pwd2) return setErr("Las contraseñas no coinciden.");

    try {
      await confirmPasswordReset(auth, oobCode, pwd);
      setDone(true);
    } catch (e) {
      console.error("confirm error:", e.code, e.message);
      if (e.code === "auth/expired-action-code") setErr("El enlace expiró. Solicita uno nuevo.");
      else if (e.code === "auth/invalid-action-code") setErr("El enlace no es válido. Vuelve a abrirlo desde el correo.");
      else if (e.code === "auth/weak-password") setErr("La contraseña es muy débil. Usa al menos 6 caracteres.");
      else setErr("No pudimos actualizar la contraseña. Intenta de nuevo.");
    }
  }

  const RightImage = (
    <div style={{ position: "relative", minHeight: "100%", background: "#0f172a" }}>
      <img
        src={groupImg}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.28 }}
      />
    </div>
  );

  if (verifying) {
    return (
      <div style={styles.page}>
        <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
          <div style={styles.card}>
            <h2 style={styles.title}>Verificando enlace…</h2>
            <p style={styles.subtitle}>Por favor espera un momento.</p>
          </div>
        </div>
        {RightImage}
      </div>
    );
  }

  if (done) {
    return (
      <div style={styles.page}>
        <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
          <div style={styles.card}>
            <h2 style={styles.title}>¡Contraseña actualizada!</h2>
            <p style={styles.subtitle}>
              Tu contraseña se cambió con éxito para <b>{verifiedEmail}</b>.
            </p>
            <Link
              to="/"
              style={{ ...styles.button, display: "inline-block", textAlign: "center", textDecoration: "none" }}
            >
              Volver al login
            </Link>
          </div>
        </div>
        {RightImage}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
        <div style={styles.card}>
          <h2 style={styles.title}>Crear nueva contraseña</h2>
          <p style={styles.subtitle}>
            Cuenta: <b>{verifiedEmail || "desconocida"}</b>
          </p>

          <form onSubmit={onSubmit} style={{ width: "100%" }}>
            <label style={styles.label}>Nueva contraseña</label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              style={styles.input}
              minLength={6}
              required
            />

            <label style={styles.label}>Confirmar contraseña</label>
            <input
              type="password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              style={styles.input}
              minLength={6}
              required
            />

            <button type="submit" style={styles.button}>
              Guardar contraseña
            </button>
          </form>

          {err && <div style={styles.error}>{err}</div>}

          <div style={{ marginTop: 16 }}>
            <Link to="/" style={styles.link}>
              Volver al login
            </Link>
          </div>
        </div>
      </div>
      {RightImage}
    </div>
  );
}

const styles = {
  page: { minHeight: "100dvh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f5f7fb" },
  card: {
    width: 380,
    maxWidth: "95vw",
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  subtitle: { marginTop: 6, marginBottom: 8, fontSize: 14, color: "#687080", textAlign: "center" },
  label: { display: "block", fontSize: 13, color: "#444", margin: "10px 0 6px" },
  input: { width: "100%", padding: "12px 14px", border: "1px solid #e3e6ef", borderRadius: 12, outline: "none" },
  button: {
    marginTop: 14,
    width: "100%",
    padding: "12px 14px",
    border: "none",
    borderRadius: 12,
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  ok: {
    marginTop: 12,
    color: "#0a7d3b",
    background: "#e9f7ef",
    border: "1px solid #bfe7cf",
    padding: "8px 10px",
    borderRadius: 10,
    width: "100%",
    fontSize: 13,
  },
  error: {
    marginTop: 12,
    color: "#7d0a0a",
    background: "#fdeeee",
    border: "1px solid #f4c7c7",
    padding: "8px 10px",
    borderRadius: 10,
    width: "100%",
    fontSize: 13,
  },
  link: { color: "#3b82f6", textDecoration: "none", fontWeight: 600 },
};
