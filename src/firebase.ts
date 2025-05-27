// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA0FTaRHAC1nykIg0RhP7kSE_GVOL5gGto",
  authDomain: "pickordump.firebaseapp.com",
  projectId: "pickordump",
  storageBucket: "pickordump.firebasestorage.app",
  messagingSenderId: "675136723268",
  appId: "1:675136723268:web:cf48b056d09c22187d9f11",
  measurementId: "G-LVHZ6LY4CR"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // ✅ 이 줄이 꼭 있어야 함
