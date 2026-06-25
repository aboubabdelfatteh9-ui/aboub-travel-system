import fs from 'fs';
import path from 'path';

// Load Firebase Config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

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
  try {
    const snap = await getDocs(collection(db, 'branches'));
    const mapped = snap.docs.map(doc => {
      console.log('Document ID:', doc.id);
      console.log('Calling doc.exists():', typeof doc.exists, doc.exists());
      return {
        id: doc.id,
        ref: doc.ref,
        data: () => doc.data(),
        exists: doc.exists()
      };
    });
    console.log('Success! Mapped count:', mapped.length);
  } catch (e: any) {
    console.error('Error occurred:', e);
  }
}

check().then(() => process.exit(0));
