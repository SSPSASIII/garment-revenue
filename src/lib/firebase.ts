// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'; // Import getAuth and connectAuthEmulator
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Your web app's Firebase configuration
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
const auth: Auth = getAuth(app); // Initialize Firebase Auth

// Connect to emulators if in development environment
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    console.log("Connecting to Firestore emulator on localhost:8080");
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log("Connecting to Auth emulator on http://localhost:9099"); // Corrected log
    connectAuthEmulator(auth, 'http://localhost:9099'); // Connect Auth emulator
  } catch (error) {
    console.error("Error connecting to Firebase emulators:", error);
  }
} else if (process.env.NODE_ENV === 'development') {
    console.log("Firebase Emulator not explicitly enabled. Skipping emulator connection. Set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in .env to enable it.");
}

export { db, auth, app }; // Export auth instance
