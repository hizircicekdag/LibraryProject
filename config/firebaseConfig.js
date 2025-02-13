// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWKKeP5R2lFTimqmhwkyXTC1wH5qwvFB8",
  authDomain: "mylibrary-3d3a3.firebaseapp.com",
  projectId: "mylibrary-3d3a3",
  storageBucket: "mylibrary-3d3a3.firebasestorage.app",
  messagingSenderId: "627649510280",
  appId: "1:627649510280:web:d1366c56b3cd7021e7183d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export const db = getFirestore(app);  

// Export the app if needed elsewhere in your application
export default app;