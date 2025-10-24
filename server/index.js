const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

// ==============================
// Inicializar Firebase Admin
// ==============================
const serviceKey = require(path.join(__dirname, "serviceAccountKey.json"));
admin.initializeApp({ credential: admin.credential.cert(serviceKey) });

const db = admin.firestore();
const app = express();

// ==============================
// CORS
// ==============================
const ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const corsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,           // estaba mal escrito como "redentials"
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Parse JSON bodies
app.use(express.json());


// ==============================
// Auth middleware
// ==============================
async function verifyToken(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ==============================
// Utils
// ==============================
function isValidCoCell(phone = "") {
  const p = String(phone).trim();
  return /^(?:\+57\s*)?(3\d{2})[\s-]?(\d{3})[\s-]?(\d{4})$/.test(p);
}
function normalizeCoCell(phone = "") {
  const m = String(phone)
    .trim()
    .match(/^(?:\+57\s*)?(3\d{2})[\s-]?(\d{3})[\s-]?(\d{4})$/);
  return m ? `+57${m[1]}${m[2]}${m[3]}` : String(phone).trim();
}

// ==============================
// Básicas
// ==============================
app.get("/api/ping", (_, res) => res.json({ ok: true }));

// Demo items
app.get("/api/items", verifyToken, async (_req, res) => {
  const snap = await db.collection("items").orderBy("createdAt", "desc").get();
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
});
app.post("/api/items", verifyToken, async (req, res) => {
  const data = {
    name: req.body.name || "Sin nombre",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    uid: req.user.uid,
  };
  const ref = await db.collection("items").add(data);
  res.status(201).json({ id: ref.id, ...data });
});

// ==============================
// Registro con validaciones
// ==============================
app.post("/api/register", verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, user_id, email, phone, user_photo } = req.body || {};
    const code = String(user_id || "").trim(); // código institucional

    if (!first_name?.trim()) return res.status(400).json({ error: "El nombre no puede ser nulo." });
    if (!last_name?.trim())  return res.status(400).json({ error: "El apellido no puede ser nulo." });
    if (!code)               return res.status(400).json({ error: "El código de la universidad es obligatorio." });
    if (!email)              return res.status(400).json({ error: "El correo electrónico es obligatorio." });
    if (!phone)              return res.status(400).json({ error: "El teléfono celular es obligatorio." });
    if (!isValidCoCell(phone))
      return res.status(400).json({ error: "Número de celular inválido. Debe iniciar en 3 y tener 10 dígitos (Colombia)." });

    const payload = {
      user_id: code,                 // guarda el código institucional
      auth_uid: req.user.uid,        // UID real de Firebase
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: String(email).trim(),
      phone: normalizeCoCell(phone),
      user_photo:
        user_photo === null
          ? admin.firestore.FieldValue.delete()
          : user_photo || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(req.user.uid).set(payload, { merge: true });
    return res.json({ message: "Registration successful", user_id: code });
  } catch (e) {
    return res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

// ==============================
// Ensure user (Google) creación/merge mínima
// ==============================
app.post("/api/ensure-user", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const urec = await admin.auth().getUser(uid);
    const docRef = db.collection("users").doc(uid);
    const snap = await docRef.get();

    const now = admin.firestore.FieldValue.serverTimestamp();
    const base = {
      // No escribir user_id aquí para no sobreescribir el código institucional
      auth_uid: uid,
      email: urec.email || null,
      first_name:
        req.body?.first_name ?? (urec.displayName?.split(" ")[0] || null),
      last_name:
        req.body?.last_name ??
        (urec.displayName?.split(" ").slice(1).join(" ") || null),
      user_photo: req.body?.user_photo ?? (urec.photoURL || null),
      providers: urec.providerData.map((p) => p.providerId),
      updatedAt: now,
    };

    if (snap.exists) {
      await docRef.set(base, { merge: true });
      return res.json({ exists: true, created: false });
    } else {
      await docRef.set({ ...base, createdAt: now });
      return res.json({ exists: false, created: true });
    }
  } catch (e) {
    return res.status(500).json({ error: "ensure-user failed", detail: String(e) });
  }
});

// ==============================
// Perfil autenticado (/api/me)
// ==============================
app.get("/api/me", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const docRef = db.collection("users").doc(uid);
    const snap = await docRef.get();
    let data = snap.exists ? snap.data() : {};

    const authRec = await admin.auth().getUser(uid);
    const tokenName = (req.user.name || "").trim();
    const authName = (authRec.displayName || "").trim();
    const fullName =
      data.first_name && data.last_name
        ? `${data.first_name} ${data.last_name}`.trim()
        : tokenName || authName;

    if (!data.first_name || !data.last_name) {
      const parts = fullName.split(/\s+/);
      data.first_name = data.first_name || parts[0] || null;
      data.last_name =
        data.last_name || (parts.length > 1 ? parts.slice(1).join(" ") : null);
    }
    if (!data.email) data.email = req.user.email || authRec.email || null;
    if (!data.user_photo) data.user_photo = req.user.picture || authRec.photoURL || null;

    // Persistir mínimos sin tocar user_id
    if (snap.exists) {
      await docRef.set(
        {
          auth_uid: uid,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          email: data.email || null,
          user_photo: data.user_photo || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return res.json({ auth_uid: uid, ...data });
  } catch (e) {
    return res.status(500).json({ error: "me failed", detail: String(e) });
  }
});

// ==============================
// Cars (1 por usuario)
// ==============================
function pickCar(b = {}) {
  const input = b || {};
  const out = {};
  if (input.license_plate) out.license_plate = String(input.license_plate).trim().toUpperCase();
  if (input.brand) out.brand = String(input.brand).trim();
  if (input.model) out.model = String(input.model).trim();
  if (input.seats != null) out.seats = Number(input.seats);

  // guarda color y emoji
  if (input.color) out.color = String(input.color);
  if (input.emoji) out.emoji = String(input.emoji);

  if (input.soat_url) out.soat_url = String(input.soat_url);
  if (input.soat_expiry) out.soat_expiry = String(input.soat_expiry);
  return out;
}

// Verificar si ya tiene carro
app.get("/api/has-car", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const snap = await db.collection("cars").doc(uid).get();
  res.json({ hasCar: snap.exists });
});

// Leer mi carro
app.get("/api/my-car", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const doc = await db.collection("cars").doc(uid).get();
  return res.json(doc.exists ? { id: uid, ...doc.data() } : {});
});

// Crear mi carro (solo si no existe)
app.post("/api/my-car", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const ref = db.collection("cars").doc(uid);
    if ((await ref.get()).exists) {
      return res.status(409).json({ error: "You already have too many cars" });
    }

    const body = pickCar(req.body);

    // Validaciones mínimas
    if (!body.license_plate) return res.status(400).json({ error: "license_plate is required" });
    if (!body.brand) return res.status(400).json({ error: "brand is required" });
    if (!body.model) return res.status(400).json({ error: "model is required" });
    if (body.seats == null || Number.isNaN(Number(body.seats))) {
      return res.status(400).json({ error: "seats must be a number" });
    }

    await ref.set({
      owner_uid: uid,
      ...body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "my-car create failed", detail: String(e) });
  }
});

// Actualizar mi carro existente
app.put("/api/my-car", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const ref = db.collection("cars").doc(uid);
  const body = pickCar(req.body);
  await ref.set(
    { ...body, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
  res.json({ ok: true });
});

// Eliminar mi carro existente
app.delete("/api/my-car", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const ref = db.collection("cars").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "No car to delete" });
  await ref.delete();
  return res.status(204).send();
});

// ==============================
// Start
// ==============================
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on :${port}`));




