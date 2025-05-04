// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Connect to Firestore emulator if in development environment
// Make sure the emulator is running (e.g., using `firebase emulators:start`)
if (process.env.NODE_ENV === 'development') {
  try {
    console.log("Connecting to Firestore emulator on localhost:8080");
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.error("Error connecting to Firestore emulator:", error);
    // Handle the error appropriately, maybe log it or show a warning
    // You might want to proceed without the emulator connection in case of error
  }
}

export { db };
