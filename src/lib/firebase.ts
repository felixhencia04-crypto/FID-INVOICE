import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "watchful-obelisk-rj4jh",
  appId: "1:1071651225729:web:c87771a868eb4314df8d80",
  apiKey: "AIzaSyCYMmRZbaO_-H--Gzl4FFAVt_yJBx-yVPg",
  authDomain: "watchful-obelisk-rj4jh.firebaseapp.com",
  storageBucket: "watchful-obelisk-rj4jh.firebasestorage.app",
  messagingSenderId: "1071651225729",
  measurementId: ""
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
