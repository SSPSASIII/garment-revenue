// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

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
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);

// Connect to Firestore emulator if in development environment
// Make sure the emulator is running (e.g., using `firebase emulators:start`)
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    console.log("Connecting to Firestore emulator on localhost:8080");
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.error("Error connecting to Firestore emulator:", error);
    // Handle the error appropriately, maybe log it or show a warning
    // You might want to proceed without the emulator connection in case of error
  }
} else if (process.env.NODE_ENV === 'development') {
    console.log("Firebase Emulator not explicitly enabled. Skipping emulator connection. Set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in .env to enable it.");
}


export { db, app };
