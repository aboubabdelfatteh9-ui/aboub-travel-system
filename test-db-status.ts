import fs from 'fs';
import path from 'path';

// Load Firebase Config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log('Firebase Config loaded:', firebaseConfig.projectId);

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const clientApp = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
});

const db = getFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

async function check() {
  const collections = ['branches', 'employees', 'trips', 'customers', 'logs'];
  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Collection [${colName}]: count = ${snap.size}`);
      if (snap.size > 0) {
        console.log(`  Sample ID of first doc: ${snap.docs[0].id}`);
      }
    } catch (e: any) {
      console.error(`Collection [${colName}] failed:`, e.message);
    }
  }
}

check().then(() => process.exit(0));
