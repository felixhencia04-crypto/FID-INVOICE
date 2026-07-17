import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBVBSJFkzaw1PUzDb1CXkuSFbrHFB5xODQ",
  authDomain: "fid-invoice.firebaseapp.com",
  projectId: "fid-invoice",
  storageBucket: "fid-invoice.firebasestorage.app",
  messagingSenderId: "406345521579",
  appId: "1:406345521579:web:c6797723f5d09de5821aee",
  measurementId: "G-3JGTSVQNZG"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
