import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "bkpm-q",
  "appId": "1:897076574261:web:f3851e72d1eed71bf9d97c",
  "storageBucket": "bkpm-q.firebasestorage.app",
  "apiKey": "AIzaSyC78V1d5EHb7yvYlBeBzuKFbTaalDebEnE",
  "authDomain": "bkpm-q.firebaseapp.com",
  "messagingSenderId": "897076574261"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
