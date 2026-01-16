
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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

export default app;
