
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAGrYetS7qHs0dUi9zMaNubpPoWsIqlvbY",
  authDomain: "fudaydiye-commerce.firebaseapp.com",
  projectId: "fudaydiye-commerce",
  storageBucket: "fudaydiye-commerce.firebasestorage.app",
  messagingSenderId: "309029801159",
  appId: "1:309029801159:web:68d82c70f4a506560002e2",
  measurementId: "G-9KM81N4EQX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Enable offline persistence with additional environment checks
// Enable offline persistence with additional environment checks
// Note: Disabled temporarily due to 'INTERNAL ASSERTION FAILED: Unexpected state' in mobile webview
/*
if (typeof window !== 'undefined' && window.indexedDB) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence failed: Browser incompatible.');
    }
  });
}
*/

export default app;
