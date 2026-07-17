import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { Client, Product, Invoice, Quotation } from '../types';

export const loadUserDataFromFirebase = async (userId: string) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    // In a real app we'd fetch subcollections, but for easy migration let's 
    // just store the whole document structure to match the old localStorage format
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading data from Firebase:', error);
    return null;
  }
};

export const saveUserDataToFirebase = async (
  userId: string, 
  data: { clients: Client[], products: Product[], invoices: Invoice[], quotations: Quotation[] }
) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, data, { merge: true });
  } catch (error) {
    console.error('Error saving data to Firebase:', error);
  }
};
