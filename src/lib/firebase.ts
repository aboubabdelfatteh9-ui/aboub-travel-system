import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Shared public Firebase Client configuration for real-time synchronization
const firebaseConfig = {
  projectId: "nth-sled-6jk7s",
  appId: "1:748610287110:web:df86016ff187d43cd7b587",
  apiKey: "AIzaSyC-FhAkmNTFyYW3ZuQjdUsTANvBnqtiqAg",
  authDomain: "nth-sled-6jk7s.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-8aa913b9-36d0-440f-b8f3-2099af0ca554",
  storageBucket: "nth-sled-6jk7s.firebasestorage.app",
  messagingSenderId: "748610287110"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
};
