import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { getAuth } from "firebase/auth";
import {
  onAuthStateChanged,
  signOut,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";


const S = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
    padding: 24,
    display: "grid",
    placeItems: "center",
  },
  container: {
    width: "min(1180px, 96vw)",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 18px 60px rgba(0,0,0,.18)",
    overflow: "hidden",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 20,
  },
  brandBtn: {
    background: "none",
    border: "none",
    fontWeight: 800,
    fontSize: 20,
    color: "#0f2230",
    cursor: "pointer",
  },
  fillBar: {
    flex: 1,
    background: "#0b0b0b",
    borderRadius: 18,
    padding: 6,
    display: "flex",
    alignItems: "center",
  },
  toolbar: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "2px solid #fff",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
  },
  userPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
    padding: "0 10px",
  },
  userCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "#1e293b",
    display: "grid",
    placeItems: "center",
  },
  body: {
    display: "grid",
    gap: 20,
    padding: "0 20px 24px 20px",
    alignItems: "start",
  },
  sidebar: {
    background: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    display: "grid",
    gap: 8,
  },
  sideItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "transparent",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
  },
  main: { paddingRight: 6 },
  sectionTitle: {
    margin: "6px 0 10px 2px",
    fontSize: 22,
    fontWeight: 800,
    color: "#0f2230",
  },
  cardWide: {
    background: "#e5e7eb",
    borderRadius: 10,
    padding: 16,
    display: "grid",
    gap: 14,
    marginBottom: 14,
  },
  headerRow: { display: "flex", alignItems: "center", gap: 16 },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editBtn: {
    background: "#0b5fff",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "6px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  avatarWrap: { display: "flex", alignItems: "center", gap: 14 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #fff",
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#1f2937",
    color: "#fff",
    fontSize: 28,
  },
  camBtn: {
    marginLeft: -8,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
  },
  nameText: { fontSize: 18, fontWeight: 800, color: "#0f2230" },
  muted: { color: "#475569", fontSize: 14 },
  grid3: { display: "grid", gap: 14 },
  field: {
    background: "#f3f4f6",
    borderRadius: 10,
    padding: 14,
    display: "grid",
    gap: 2,
  },
  fieldLabel: { fontSize: 12, color: "#6b7280" },
  fieldValue: { fontSize: 14, fontWeight: 700, color: "#111827" },
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    color: "#333",
    fontWeight: 600,
  },
};

export default function User() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches
  );
  const [me, setMe] = useState({
    user_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    user_photo: "",
  });
  const [hasPassword, setHasPassword] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const on = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/");
        return;
      }
      try {
        setMe(await api("/api/me", { method: "GET" }));
        if (u.email) {
           const methods = await fetchSignInMethodsForEmail(auth, u.email);
           setHasPassword(methods.includes("password"));
           setHasGoogle(methods.includes("google.com"));
        } 
      }finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  const fullName =
    `${me.first_name || ""} ${me.last_name || ""}`.trim() || "Usuario";

  const dev = (l) => alert(`${l}: en desarrollo`);

  // ---- Cerrar sesión y bloquear volver ----
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
      setTimeout(() => window.location.replace("/"), 0);
    } catch (err) {
      alert("No se pudo cerrar sesión");
    }
  };

  if (loading) return <div style={S.loading}>Cargando…</div>;

  // --- Paso 3: función para agregar contraseña a una cuenta Google ---
  async function addPasswordToGoogleAccount(newPassword) {
    const authI = getAuth();
    const user = authI.currentUser;

    if (!user) {
      alert("Debes iniciar sesión primero.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      // 1) Intentar vincular credencial password
      const cred = EmailAuthProvider.credential(user.email, newPassword);
      await linkWithCredential(user, cred);

    } catch (err) {
      // 2) Si Firebase pide reautenticación reciente, reautenticar con Google y reintentar
      if (err?.code === "auth/requires-recent-login") {
        try {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
          const cred = EmailAuthProvider.credential(user.email, newPassword);
          await linkWithCredential(user, cred);
        } catch (reauthErr) {
          console.error("Fallo al reautenticar/vincular:", reauthErr);
          alert("No se pudo completar la vinculación. Intenta iniciar sesión de nuevo.");
          return;
        }
      } else if (err?.code === "auth/provider-already-linked") {
        alert("Esta cuenta ya tiene contraseña vinculada.");
        return;
      } else {
        console.error("Error al vincular contraseña:", err);
        alert("No se pudo agregar la contraseña. Revisa la consola para más detalles.");
        return;
      }
    }

    // 3) Éxito → refrescar indicadores de proveedores
    try {
      const methods = await fetchSignInMethodsForEmail(authI, user.email);
      setHasPassword(methods.includes("password"));
      setHasGoogle(methods.includes("google.com"));
    } catch (_) {
      // si falla este refresh, no bloquea el flujo
    }

    alert("Contraseña agregada correctamente. Ahora también puedes usar 'Recuperar contraseña'.");
  }



  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* TOP BAR */}
        <header style={S.topbar}>
          <button style={S.brandBtn} onClick={() => navigate("/dashboard")}>
            MoveTogether
          </button>

          {/* Barra azul que ocupa el espacio restante */}
          <div style={S.fillBar}>
            <div style={S.toolbar}>
              <button style={S.iconBtn} onClick={() => dev("Mensajes")}>💬</button>
              <button style={S.iconBtn} onClick={() => dev("Notificaciones")}>🔔</button>
              <div style={S.userPill}>
                <div style={S.userCircle}>👤</div>
                <span>{fullName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div
          style={{
            ...S.body,
            gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
          }}
        >
          {/* SIDEBAR */}
          <aside style={S.sidebar}>
            {["My trips", "My Car", "Settings", "Help"].map((t) => (
              <button
                key={t}
                style={S.sideItem}
                onClick={() => (t === "My Car" ? navigate("/my-car") : dev(t))}
              >
                <span>{t}</span>
                <span style={{ fontWeight: 700 }}>+</span>
              </button>
            ))}
            {/* Cerrar sesión real */}
            <button style={S.sideItem} onClick={handleLogout}>
              <span>Close session</span>
              <span style={{ fontWeight: 700 }}>+</span>
            </button>
          </aside>

          {/* MAIN */}
          <main style={S.main}>
            <h2 style={S.sectionTitle}>My profile</h2>

            {/* HEADER CARD */}
            <section style={S.cardWide}>
              <div style={S.headerRow}>
                <div style={S.avatarWrap}>
                  {me.user_photo ? (
                    <img src={me.user_photo} alt="avatar" style={S.avatar} />
                  ) : (
                    <div style={S.avatarFallback}>👤</div>
                  )}
                  <button style={S.camBtn} onClick={() => dev("Cambiar foto")}>
                    📷
                  </button>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={S.nameText}>{fullName}</div>
                  <div style={S.muted}>{me.email || "—"}</div>
                  <div style={S.muted}>{me.phone || "—"}</div>
                </div>
              </div>
            </section>

              {/* SECURITY */}
                <section style={S.cardWide}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f2230", marginBottom: 6 }}>Security</div>
                      <div style={{ color: "#475569", fontSize: 14 }}>
                        Métodos activos:&nbsp;
                        {hasPassword ? (
                          <span>Contraseña ✅</span>
                        ) : (
                          <span>Contraseña ❌</span>
                        )}
                      </div>
                    </div>

                    {/* 👉 Muestra el botón si NO hay contraseña */}
                    {!hasPassword && (
                      <button
                        style={S.editBtn}
                        onClick={() => {
                          const pwd = prompt("Ingresa una nueva contraseña segura (mínimo 6 caracteres):");
                          if (!pwd || pwd.length < 6) {
                            alert("La contraseña debe tener al menos 6 caracteres.");
                            return;
                          }
                          addPasswordToGoogleAccount(pwd);
                        }}
                      >
                        Agregar contraseña
                      </button>
                    )}
                  </div>
                </section>
                
            {/* DETAILS */}
            <section style={S.cardWide}>
              <div style={S.cardHeader}>
                <div />
                <button style={S.editBtn} onClick={() => dev("Editar perfil")}>
                  Edit
                </button>
              </div>

              <div
                style={{
                  ...S.grid3,
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                }}
              >
                <Field label="First name" value={me.first_name || "—"} />
                <Field label="Last name" value={me.last_name || "—"} />
                <Field label="Institutional email" value={me.email || "—"} />
                <Field label="ID" value={me.user_id || "—"} />
                <Field label="Phone number" value={me.phone || "—"} />
                <Field label="City" value="—" />
                <Field label="Address" value="—" />
                <Field label="Nearby landmark" value="—" />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
  

  function Field({ label, value }) {
    return (
      <div style={S.field}>
        <div style={S.fieldLabel}>{label}</div>
        <div style={S.fieldValue}>{value}</div>
      </div>
    );
  }


}