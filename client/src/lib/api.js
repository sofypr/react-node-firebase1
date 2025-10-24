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

  // 3. Manejar errores HTTP
  if (!res.ok) {
    let message;
    try {
      const err = await res.json();
      message = err.error || err.message || JSON.stringify(err);
    } catch {
      message = await res.text();
    }
    throw new Error(message || `Error ${res.status}`);
  }

  // 4. Retornar JSON o vacío si no hay contenido
  try {
    return await res.json();
  } catch {
    return {};
  }
}
