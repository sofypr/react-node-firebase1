// client/src/lib/api.js
import { auth } from "./firebase";

/**
 * Cliente central para consumir tu backend con autenticación Firebase.
 * - Adjunta automáticamente el ID Token de Firebase en el header Authorization.
 * - Maneja respuestas JSON y errores de forma uniforme.
 *
 * Uso:
 *   await api("/api/me");
 *   await api("/api/register", { method: "POST", body: { ... } });
 */
export async function api(path, { method = "GET", body, headers = {} } = {}) {
  // 1. Obtener token actual del usuario autenticado (si existe)
  const token = auth.currentUser ? await auth.currentUser.getIdToken(true) : null;

  // 2. Hacer la petición al backend (localhost:4000)
  const res = await fetch(`http://localhost:4000${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 3. Leer el cuerpo UNA sola vez para evitar "body stream already read"
  let raw = "";
  try {
    raw = await res.text();
  } catch {
    raw = "";
  }

  // 4. Manejar errores HTTP usando el cuerpo ya leído
  if (!res.ok) {
    let message = `Error ${res.status}`;
    if (raw) {
      try {
        const err = JSON.parse(raw);
        message = err.error || err.message || message;
      } catch {
        message = raw;
      }
    }
    throw new Error(message);
  }

  // 5. Retornar JSON si es posible, o vacío
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
