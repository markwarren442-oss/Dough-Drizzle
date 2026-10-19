// ─────────────────────────────────────────────────────────────────────────────
// Firebase Configuration — Dough & Drizzle
//
// To get your Firebase config:
//   1. Go to https://console.firebase.google.com
//   2. Create a project (or open existing one)
//   3. Click ⚙️ (Project Settings) → "Your apps" → Add a Web App
//   4. Copy the firebaseConfig object values into your .env.local
//   5. In Firestore Database → Rules, set:
//      allow read, write: if true;   ← for now (you can add auth later)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initializing the app on hot-reload in Next.js dev mode
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
