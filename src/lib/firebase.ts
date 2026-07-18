import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCYMmRZbaO_-H--Gzl4FFAVt_yJBx-yVPg",
  authDomain: "watchful-obelisk-rj4jh.firebaseapp.com",
  projectId: "watchful-obelisk-rj4jh",
  storageBucket: "watchful-obelisk-rj4jh.firebasestorage.app",
  messagingSenderId: "1071651225729",
  appId: "1:1071651225729:web:c87771a868eb4314df8d80",
  measurementId: ""
};


export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, "ai-studio-fidinvoice-113f2c1e-5b42-4330-b445-295795b85286");
