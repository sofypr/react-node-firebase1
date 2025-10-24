// client/src/pages/EmailActionHandler.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function EmailActionHandler() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    // Evitar doble ejecución en StrictMode
    if (handled.current) return;
    handled.current = true;

    // Solo manejar si estamos en /__/auth/*
    if (!window.location.pathname.startsWith("/__/auth")) return;

    const qs = new URLSearchParams(window.location.search);
    const hs = new URLSearchParams(window.location.hash.slice(1));
    const mode = qs.get("mode") || hs.get("mode");
    const oob  = qs.get("oobCode") || hs.get("oobCode");

    console.log("[EmailActionHandler] mode:", mode, "oob:", oob);

    // Redirigir únicamente cuando es válido
    if (mode === "resetPassword" && oob) {
      navigate(`/reset-password?oobCode=${encodeURIComponent(oob)}`, { replace: true });
    }
    // IMPORTANTE: no navegamos al "/" cuando no hay mode/oob
    // para evitar el rebote al login durante la 2ª ejecución
  }, [navigate]);

  return null;
}
