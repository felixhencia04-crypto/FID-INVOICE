import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "watchful-obelisk-rj4jh",
  appId: "1:1071651225729:web:c87771a868eb4314df8d80",
  apiKey: "AIzaSyCYMmRZbaO_-H--Gzl4FFAVt_yJBx-yVPg",
  authDomain: "watchful-obelisk-rj4jh.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-fidinvoice-113f2c1e-5b42-4330-b445-295795b85286",
  storageBucket: "watchful-obelisk-rj4jh.firebasestorage.app",
  messagingSenderId: "1071651225729"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
