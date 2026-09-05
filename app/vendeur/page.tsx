"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { auth, db } from "../../lib/firebase";

export default function VendeurPage() {
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChargement(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleConnexionGoogle() {
    setErreur("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          nom: result.user.displayName ?? "",
          isPremium: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch {
      setErreur("La connexion a échoué. Réessaie.");
    }
  }

  async function handleDeconnexion() {
    await signOut(auth);
  }

  if (chargement) {
    return <div className="min-h-screen bg-[#F8F6F2] pb-40" />;
  }

  if (user) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] pb-40 px-4 pt-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#EEE8DD] p-6">
          <h1 className="text-xl font-bold text-[#17161A] mb-1">Espace Vendeur</h1>
          <p className="text-sm text-[#17161A]/60 mb-6">Connecté avec {user.email}</p>

          <Link href="/vendeur/publier" className="block text-center w-full bg-[#FF6E14] text-white font-semibold py-3 rounded-full mb-3">
            + Publier un produit
          </Link>

          <button className="w-full bg-[#0B0B10] text-white font-semibold py-3 rounded-full mb-3">
            Mes produits publiés
          </button>

          <Link href="/vendeur/devenir-premium" className="block text-center w-full bg-gradient-to-r from-[#CB9A46] to-[#FF6E14] text-white font-semibold py-3 rounded-full mb-3">
            ⭐ Devenir vendeur premium
          </Link>

          <Link href="/vendeur/devenir-chauffeur" className="block text-center w-full border border-[#0B0B10] text-[#0B0B10] font-semibold py-3 rounded-full mb-3">
            🚗 S&apos;inscrire comme chauffeur
          </Link>

          <button onClick={handleDeconnexion} className="w-full text-[#17161A]/60 text-sm py-2">
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-40 px-4 pt-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#EEE8DD] p-6 text-center">
        <h1 className="text-xl font-bold text-[#17161A] mb-1">Espace Vendeur</h1>
        <p className="text-sm text-[#17161A]/60 mb-6">
          Connecte-toi avec Google pour commencer à vendre sur Sirius.
        </p>
        {erreur && <p className="text-red-500 text-xs mb-3">{erreur}</p>}
        <button
          onClick={handleConnexionGoogle}
          className="w-full flex items-center justify-center gap-3 border border-[#EEE8DD] rounded-full py-3 font-semibold text-[#17161A]"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.4C40.9 36.8 44 31 44 24c0-1.3-.1-2.7-.4-3.5z" />
          </svg>
          Continuer avec Google
        </button>
      </div>
    </div>
  );
}