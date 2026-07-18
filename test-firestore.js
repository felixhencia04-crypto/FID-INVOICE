import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const threadInfo = {
      userId: 'test-user-cli',
      userName: 'CLI Test',
      userEmail: 'cli@example.com',
      lastMessage: 'Hello from CLI',
      lastUpdated: new Date().toISOString(),
      unreadForOwner: true,
      unreadForUser: false
    };
    await setDoc(doc(db, 'supportChats', 'test-user-cli'), threadInfo);
    console.log("Write success!");

    const q = await getDocs(collection(db, 'supportChats'));
    console.log("Read success! Documents found:", q.docs.length);
  } catch (e) {
    console.error("Firestore test failed:", e);
  }
}
test();
