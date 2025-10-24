// client/src/pages/RecoverPassword.jsx
import { useState } from 'react';
import { getAuth, fetchSignInMethodsForEmail, sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';
import groupImg from '../assets/Group27.png';

export default function RecoverPassword() {
  const auth = getAuth();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    const mail = email.trim();
    if (!mail) {
      setErr("Ingresa un correo válido.");
      return;
    }

    try {
      setSending(true);

      // Llamar directo: Firebase decidirá si existe y si puede enviar
      await sendPasswordResetEmail(getAuth(), email.trim(), {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });



      setMsg("Te enviamos un correo con el enlace de recuperación. Revisa tu bandeja de entrada (y spam).");
    } catch (e) {
      console.error("reset error:", e);
      // Manejo fino por códigos
      if (e.code === "auth/user-not-found") {
        setErr("No existe una cuenta con ese correo o no tiene contraseña vinculada.");
      } else if (e.code === "auth/invalid-continue-uri" || e.code === "auth/missing-continue-uri") {
        setErr("El enlace de retorno es inválido. Verifica que el dominio esté autorizado en Firebase.");
      } else if (e.code === "auth/too-many-requests") {
        setErr("Has hecho demasiados intentos. Inténtalo más tarde.");
      } else {
        setErr("No pudimos enviar el correo de recuperación. Intenta de nuevo.");
      }
    } finally {
      setSending(false);
    }
  }


  return (
    <div style={styles.page}>
      {/* Columna izquierda: formulario */}
      <div style={{ display: 'grid', placeItems: 'center', padding: 16 }}>
        <div style={styles.card}>
          <h2 style={styles.title}>Recuperar contraseña</h2>
          <p style={styles.subtitle}>Ingresa tu correo para recuperar tu cuenta.</p>

          <form onSubmit={onSubmit} style={{ width: '100hv' }}>
            <label style={styles.label}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <button type="submit" style={styles.button} disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar codigo'}
            </button>
          </form>

          {msg && <div style={styles.ok}>{msg}</div>}
          {err && <div style={styles.error}>{err}</div>}

          <div style={{ marginTop: 16 }}>
            <Link to="/" style={styles.link}>Volver al login</Link>
          </div>
        </div>
      </div>

      {/* Columna derecha: imagen */}
      <div style={{ position: 'relative', minHeight: '100%', background: '#0f172a' }}>
        <img
          src={groupImg}
          alt="background"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.28 }}
        />
      </div>
    </div>
  );
}

/* MISMAS CLAVES DEL OBJETO STYLES */
const styles = {
  page: { minHeight: '100dvh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f5f7fb' },
  card: { width: 380, maxWidth: '95vw', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  subtitle: { marginTop: 6, marginBottom: 8, fontSize: 14, color: '#687080', textAlign: 'center' },
  label: { display: 'block', fontSize: 13, color: '#444', margin: '10px 0 6px' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #e3e6ef', borderRadius: 12, outline: 'none' },
  button: { marginTop: 14, width: '100%', padding: '12px 14px', border: 'none', borderRadius: 12, background: '#111827', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  ok: { marginTop: 12, color: '#0a7d3b', background: '#e9f7ef', border: '1px solid #bfe7cf', padding: '8px 10px', borderRadius: 10, width: '100%', fontSize: 13 },
  error: { marginTop: 12, color: '#7d0a0a', background: '#fdeeee', border: '1px solid #f4c7c7', padding: '8px 10px', borderRadius: 10, width: '100%', fontSize: 13 },
  link: { color: '#3b82f6', textDecoration: 'none', fontWeight: 600 },
};
