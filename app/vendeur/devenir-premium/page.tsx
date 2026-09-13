"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

const LIEN_PAIEMENT_PREMIUM = "https://cltmgung.mychariow.shop/prd_t55gvtma";
const PAYS_LISTE = ["Burkina Faso", "Côte d'Ivoire", "Togo", "Bénin", "Mali", "Niger", "Chine"];

export default function DevenirPremiumPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [chargementAuth, setChargementAuth] = useState(true);
  const [estPremium, setEstPremium] = useState(false);
  const [chargementStatut, setChargementStatut] = useState(true);

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pays, setPays] = useState("Burkina Faso");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
      setEmail(u?.email ?? "");
      setNom(u?.displayName ?? "");
      setChargementAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setChargementStatut(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      setEstPremium(snap.exists() && snap.data().isPremium === true);
      setChargementStatut(false);
    });
    return () => unsub();
  }, [uid]);

  function handlePayer() {
    setErreur("");
    if (!uid) {
      setErreur("Vous devez être connecté (Espace Vendeur).");
      return;
    }
    if (!nom.trim() || !email.trim() || !phone.trim()) {
      setErreur("Remplissez votre nom, email et téléphone.");
      return;
    }

    window.location.href = LIEN_PAIEMENT_PREMIUM;
  }

  if (chargementAuth || chargementStatut) {
    return <div className="min-h-screen bg-black/40 pb-40" />;
  }

  if (!uid) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] pb-40 px-4 pt-8 text-center">
        <p className="text-[#17161A]/70">Connecte-toi depuis l&apos;Espace Vendeur pour continuer.</p>
      </div>
    );
  }

  if (estPremium) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] pb-40 px-4 pt-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#EEE8DD] p-6 text-center">
          <p className="text-amber-600 font-semibold">⭐ Vous êtes déjà vendeur premium.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/40 flex items-start justify-center px-4 pt-10 pb-40">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        <h1 className="text-2xl font-bold text-[#17161A]">Devenir Vendeur Premium</h1>
        <p className="text-[#17161A]/80">
          Le mode Premium fait la promotion de TOUS vos produits publiés :
        </p>
        <ul className="space-y-2 text-[#17161A]/90">
          <li className="flex gap-2">✅ <span>Badge Premium visible par les clients</span></li>
          <li className="flex gap-2">✅ <span>Vos produits apparaissent en priorité dans les recherches</span></li>
          <li className="flex gap-2">✅ <span>Mise en avant sur les réseaux Sirius E-commerce</span></li>
          <li className="flex gap-2">✅ <span>Notifications hebdomadaires envoyées à tous les utilisateurs</span></li>
        </ul>
        <p className="text-[#17161A]/80">
          Prix : 2000 FCFA / mois. Renseignez vos informations puis payez en ligne.
        </p>

        <input type="text" placeholder="Votre nom" value={nom} onChange={(e) => setNom(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]" />
        <input type="email" placeholder="Votre email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]" />
        <input type="tel" placeholder="Votre téléphone" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]" />
        <select value={pays} onChange={(e) => setPays(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]">
          {PAYS_LISTE.map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>

        {erreur && <p className="text-red-500 text-xs">{erreur}</p>}

        <div className="flex items-center justify-between pt-2">
          <a href="/vendeur" className="text-[#5A3FD6] font-semibold">Annuler</a>
          <button onClick={handlePayer}
            className="bg-[#FFB800] text-black font-bold px-6 py-3 rounded-full">
            Payer en ligne
          </button>
        </div>
      </div>
    </div>
  );
}