// config/firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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

// Initialize Firebase Authentication with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);  

// Export the app if needed elsewhere in your application
export default app;


