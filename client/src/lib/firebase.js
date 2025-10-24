// client/src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAmMo-jfQUdxQesv_mZszIWpEim67sDCTk",
  authDomain: "react-node-firebase-a9304.firebaseapp.com",
  projectId: "react-node-firebase-a9304",
  storageBucket: "react-node-firebase-a9304.appspot.com",
  messagingSenderId: "677234789121",
  appId: "1:677234789121:web:1209997fb248aa40946900",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}
