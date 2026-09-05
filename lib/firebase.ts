import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDg8_QwGDPg_k1r3IHBC4qxokiKts_ejpY",
  authDomain: "siriuspawend.firebaseapp.com",
  projectId: "siriuspawend",
  storageBucket: "siriuspawend.firebasestorage.app",
  messagingSenderId: "817438941619",
  appId: "1:817438941619:web:632b0ca96bd7fdaaf56bc6",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);