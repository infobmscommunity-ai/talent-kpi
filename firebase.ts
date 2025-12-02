import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8nyCgzw6RKyVn5KSE0YMHFOZ8GkR3LDI",
  authDomain: "talent-b6ba6.firebaseapp.com",
  projectId: "talent-b6ba6",
  storageBucket: "talent-b6ba6.firebasestorage.app",
  messagingSenderId: "571612614414",
  appId: "1:571612614414:web:05272be39e9672c371d15f",
  measurementId: "G-7YP40LJ6WG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);