const { beforeUserCreated, beforeUserSignedIn } = require("firebase-functions/v2/identity");

function allowed(email){
  return /@unisabana\.edu\.co$/i.test(email || "");
}

// Bloquea creación si no es dominio permitido o email no verificado (para Google)
exports.enforceDomainOnCreate = beforeUserCreated((event) => {
  const { email, signInProvider, emailVerified } = event.data;
  if (signInProvider === "google.com") return; // permitir Google
  if (!allowed(email)) {
    throw new Error("Solo correos @unisabana.edu.co");
  }
});

// (opcional) Revalida en cada login
exports.enforceDomainOnSignIn = beforeUserSignedIn((event) => {
  const { email, signInProvider } = event.data;
  if (signInProvider === "google.com") return;
  if (!allowed(email)) {
    throw new Error("Solo correos @unisabana.edu.co");
  }
});
