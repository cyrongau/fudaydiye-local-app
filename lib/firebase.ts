
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";
import { connectFunctionsEmulator } from "firebase/functions";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("DEBUG: Active Firebase Project ID:", firebaseConfig.projectId);


// Initialize App Check
if (typeof window !== 'undefined') {
  // Enable debug token for localhost dev
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LeTcEssAAAAANYZ-vh5x6f6K0Q2eDxVsmmuet6c'),
      isTokenAutoRefreshEnabled: true
    });
    console.log("App Check initialized with ReCaptcha Enterprise");
  } catch (e) {
    console.error("App Check init failed:", e);
  }
}

// Initialize services
export const auth = getAuth(app);

// Use memory cache to avoid "Internal Assertion Failed" loops from corrupted IndexedDB
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export const storage = getStorage(app);
export const functions = getFunctions(app);


// Connect to Emulators if on localhost
// if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
//   // connectAuthEmulator(auth, "http://127.0.0.1:9099");
//   // connectFirestoreEmulator(db, '127.0.0.1', 8080);
//   // connectStorageEmulator(storage, '127.0.0.1', 9199);
//   // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
//   // console.log("Connected to Firebase Emulators");
// }

export default app;
