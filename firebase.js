import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  setDoc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let firebaseConfig = null;
let app = null;
let auth = null;
let db = null;

export async function initFirebase() {
  try {
    // Optional file the user will create.
    const mod = await import("./firebase-config.js");
    firebaseConfig = mod.firebaseConfig;
  } catch {
    return {
      ok: false,
      reason:
        "Missing Firebase config. Create firebase-config.js (copy from firebase-config.example.js) and fill in your keys.",
    };
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // If a Google sign-in redirect just happened, process it so errors don't get swallowed.
  try {
    await getRedirectResult(auth);
  } catch {
    // ignore; UI will show auth state via onAuthStateChanged
  }

  return { ok: true };
}

export function watchAuth(callback) {
  if (!auth) throw new Error("Firebase not initialized");
  return onAuthStateChanged(auth, callback);
}

export async function signUpWithEmailPassword(email, password) {
  if (!auth) throw new Error("Firebase not initialized");
  await createUserWithEmailAndPassword(auth, email, password);
  return auth.currentUser;
}

export async function signInWithEmailPassword(email, password) {
  if (!auth) throw new Error("Firebase not initialized");
  await signInWithEmailAndPassword(auth, email, password);
  return auth.currentUser;
}

export async function signInWithGooglePopup() {
  if (!auth) throw new Error("Firebase not initialized");
  const provider = new GoogleAuthProvider();

  // Mobile browsers (and many in-app browsers) commonly block popups.
  // Prefer redirect on coarse pointers (phones/tablets).
  const preferRedirect =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;

  if (preferRedirect) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    await signInWithPopup(auth, provider);
    return auth.currentUser;
  } catch (e) {
    // Fallback to redirect if popup is blocked/unsupported.
    const code = e?.code || "";
    if (
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw e;
  }
}

export async function signOutUser() {
  if (!auth) throw new Error("Firebase not initialized");
  await signOut(auth);
}

export function userCollections(uid) {
  if (!db) throw new Error("Firebase not initialized");
  const userDoc = doc(db, "users", uid);
  return {
    userDoc,
    categories: collection(userDoc, "categories"),
    transactions: collection(userDoc, "transactions"),
  };
}

export function firestoreApi() {
  return {
    collection,
    doc,
    addDoc,
    deleteDoc,
    setDoc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
  };
}
