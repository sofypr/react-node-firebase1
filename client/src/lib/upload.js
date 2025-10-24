// client/src/lib/upload.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadUserPhoto(file, uid) {
  if (!file) throw new Error("No file provided");
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const path = `users/${uid}/avatar_${Date.now()}.${ext}`;
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file, { contentType: file.type });
  return await getDownloadURL(snap.ref);
}
