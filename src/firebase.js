import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7rFt2v9GreiZjGUSr4pUHCH1P5T2OEkA",
  authDomain: "men4menstruation-40835.firebaseapp.com",
  projectId: "men4menstruation-40835",
  storageBucket: "men4menstruation-40835.firebasestorage.app",
  messagingSenderId: "12917516111",
  appId: "1:12917516111:web:27af5d1274d9fdaa28873a",
  measurementId: "G-H978FFG450"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
