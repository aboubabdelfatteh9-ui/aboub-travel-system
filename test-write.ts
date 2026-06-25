import fs from 'fs';
import path from 'path';

// Load Firebase Config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const clientApp = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
});

const rawDb = getFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

async function testWrite() {
  console.log('Testing Firestore Client SDK Write...');
  try {
    const docRef = doc(rawDb, 'customers', 'test-cust-id-123');
    await setDoc(docRef, {
      id: 'test-cust-id-123',
      firstName: 'Test',
      lastName: 'User',
      registrationDate: new Date().toISOString()
    });
    console.log('Write Succeeded!');

    // Read it back
    const snap = await getDoc(docRef);
    console.log('Read back:', snap.exists(), snap.data());

    // Delete it to clean up
    await deleteDoc(docRef);
    console.log('Cleanup Delete Succeeded!');
  } catch (error) {
    console.error('Test Failed:', error);
  }
}

testWrite().then(() => process.exit(0));
