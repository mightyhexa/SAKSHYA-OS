import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const serverDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function checkFirestoreConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const q = query(collection(serverDb, 'cases'), limit(1));
    await getDocs(q);
    return { connected: true };
  } catch (err: any) {
    console.error('Firestore connection check error:', err?.message || err);
    return { connected: false, error: err?.message || String(err) };
  }
}
