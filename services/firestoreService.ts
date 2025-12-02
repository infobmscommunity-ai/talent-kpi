import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

export const getData = async <T>(collectionName: string): Promise<T[]> => {
  const q = query(collection(db, collectionName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const addData = async <T extends object>(collectionName: string, data: T) => {
  return await addDoc(collection(db, collectionName), data);
};

export const updateData = async (collectionName: string, id: string, data: any) => {
  const docRef = doc(db, collectionName, id);
  return await updateDoc(docRef, data);
};

export const deleteData = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  return await deleteDoc(docRef);
};