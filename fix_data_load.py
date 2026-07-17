import re

with open('src/lib/dataService.ts', 'r') as f:
    content = f.read()

old_load = """export const loadUserDataFromFirebase = async (userId: string) => {
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
};"""

new_load = """export const loadUserDataFromFirebase = async (userId: string) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    
    let data: any = { clients: [], products: [], invoices: [], quotations: [] };
    
    // Load from embedded arrays first (if any)
    if (docSnap.exists()) {
      const docData = docSnap.data();
      if (docData.clients) data.clients = docData.clients;
      if (docData.products) data.products = docData.products;
      if (docData.invoices) data.invoices = docData.invoices;
      if (docData.quotations) data.quotations = docData.quotations;
    }

    // Always load from subcollections as they are the source of truth for new changes
    const clientsSnap = await getDocs(collection(userDocRef, 'clients'));
    const productsSnap = await getDocs(collection(userDocRef, 'products'));
    const invoicesSnap = await getDocs(collection(userDocRef, 'invoices'));
    const quotationsSnap = await getDocs(collection(userDocRef, 'quotations'));

    const mergeData = (arr1: any[], arr2: any[]) => {
      const map = new Map();
      arr1.forEach(i => map.set(i.id, i));
      arr2.forEach(i => map.set(i.id, i));
      return Array.from(map.values());
    };

    data.clients = mergeData(data.clients, clientsSnap.docs.map(d => d.data() as Client));
    data.products = mergeData(data.products, productsSnap.docs.map(d => d.data() as Product));
    data.invoices = mergeData(data.invoices, invoicesSnap.docs.map(d => d.data() as Invoice));
    data.quotations = mergeData(data.quotations, quotationsSnap.docs.map(d => d.data() as Quotation));

    return data;
  } catch (error) {
    console.error('Error loading data from Firebase:', error);
    return null;
  }
};"""

content = content.replace(old_load, new_load)

with open('src/lib/dataService.ts', 'w') as f:
    f.write(content)

