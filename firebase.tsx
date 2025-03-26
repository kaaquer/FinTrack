// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApMWXQpXNWXfQzBIBU0SiAcTQsmGxjO2Y",
  authDomain: "fireauth-5e976.firebaseapp.com",
  projectId: "fireauth-5e976",
  storageBucket: "fireauth-5e976.firebasestorage.app",
  messagingSenderId: "246364176767",
  appId: "1:246364176767:web:07804d899743ce02625a4a"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };