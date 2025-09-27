// components/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBWEOFsDY_1_MBLQ1XJ6iWuS9wipPNklPo",
  authDomain: "meetsync-3ec58.firebaseapp.com",
  projectId: "meetsync-3ec58",
  storageBucket: "meetsync-3ec58.firebasestorage.app",
  messagingSenderId: "629532410973",
  appId: "1:629532410973:web:60654cb86c78c45c2939b4",
  measurementId: "G-G5FK69VTBG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export auth correctly
const auth = getAuth(app);
export { auth };
