import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch, deleteField } from 'firebase/firestore';
import { Client, Product, Invoice, Quotation } from '../types';

export const loadUserDataFromFirebase = async (userId: string) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    const docSnap = await getDoc(userDocRef);
    let data: any = { clients: [], products: [], invoices: [], quotations: [] };
    let hasMigrated = false;
    
    if (docSnap.exists()) {
      const docData = docSnap.data();
      if (docData.migratedToSubcollections) {
        hasMigrated = true;
      } else {
        if (docData.clients) data.clients = docData.clients;
        if (docData.products) data.products = docData.products;
        if (docData.invoices) data.invoices = docData.invoices;
        if (docData.quotations) data.quotations = docData.quotations;
      }
    }

    if (hasMigrated) {
      const clientsSnap = await getDocs(collection(userDocRef, 'clients'));
      const productsSnap = await getDocs(collection(userDocRef, 'products'));
      const invoicesSnap = await getDocs(collection(userDocRef, 'invoices'));
      const quotationsSnap = await getDocs(collection(userDocRef, 'quotations'));

      data.clients = clientsSnap.docs.map(d => d.data() as Client);
      data.products = productsSnap.docs.map(d => d.data() as Product);
      data.invoices = invoicesSnap.docs.map(d => d.data() as Invoice);
      data.quotations = quotationsSnap.docs.map(d => d.data() as Quotation);
    }

    return data;
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
    
    // Helper to chunk arrays
    const chunkArray = (arr: any[], size: number) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    let allOperations: { path: string, id: string, data: any }[] = [];
    
    data.clients.forEach(c => allOperations.push({ path: 'clients', id: c.id, data: c }));
    data.products.forEach(p => allOperations.push({ path: 'products', id: p.id, data: p }));
    data.invoices.forEach(i => allOperations.push({ path: 'invoices', id: i.id, data: i }));
    data.quotations.forEach(q => allOperations.push({ path: 'quotations', id: q.id, data: q }));

    const chunks = chunkArray(allOperations, 450); // limit is 500

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const op of chunk) {
        const ref = doc(userDocRef, op.path, op.id);
        batch.set(ref, op.data, { merge: true });
      }
      await batch.commit();
    }
    
    // Clear out the massive arrays from the main document to free up space
    await setDoc(userDocRef, { 
      clients: deleteField(),
      products: deleteField(),
      invoices: deleteField(),
      quotations: deleteField(),
      migratedToSubcollections: true 
    }, { merge: true });

  } catch (error) {
    console.error('Error saving data to Firebase:', error);
  }
};

export const syncToFirebaseSubcollections = async (
  userId: string,
  oldData: any,
  newData: { clients: Client[], products: Product[], invoices: Invoice[], quotations: Quotation[] }
) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    let allOperations: { path: string, id: string, data?: any, type: 'set' | 'delete' }[] = [];

    const getDiff = (oldItems: any[] = [], newItems: any[] = [], path: string) => {
      const oldMap = new Map(oldItems.map(i => [i.id, i]));
      const newMap = new Map(newItems.map(i => [i.id, i]));

      // Check for deletes
      oldItems.forEach(item => {
        if (!newMap.has(item.id)) {
          allOperations.push({ path, id: item.id, type: 'delete' });
        }
      });

      // Check for adds and updates
      newItems.forEach(item => {
        const oldItem = oldMap.get(item.id);
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
          allOperations.push({ path, id: item.id, data: item, type: 'set' });
        }
      });
    };

    getDiff(oldData?.clients, newData.clients, 'clients');
    getDiff(oldData?.products, newData.products, 'products');
    getDiff(oldData?.invoices, newData.invoices, 'invoices');
    getDiff(oldData?.quotations, newData.quotations, 'quotations');

    if (allOperations.length === 0) return; // nothing to do

    const chunkArray = (arr: any[], size: number) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    const chunks = chunkArray(allOperations, 450); 

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const op of chunk) {
        const ref = doc(userDocRef, op.path, op.id);
        if (op.type === 'set') {
          batch.set(ref, op.data, { merge: true });
        } else if (op.type === 'delete') {
          batch.delete(ref);
        }
      }
      await batch.commit();
    }
  } catch (error) {
    console.error('Error syncing to Firebase:', error);
  }
};
