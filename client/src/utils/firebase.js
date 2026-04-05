// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "hunger-food-app-9aa93.firebaseapp.com",
  projectId: "hunger-food-app-9aa93",
  storageBucket: "hunger-food-app-9aa93.firebasestorage.app",
  messagingSenderId: "411531976436",
  appId: "1:411531976436:web:10a2affde415918ee248a1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
