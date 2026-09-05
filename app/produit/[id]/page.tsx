"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

type Produit = {
  id: string;
  nom: string;
  prixNombre: number;
  image: string;
  ville: string;
  pays: string;
  categorie: string;
  sellerId: string;
};

function getOrCreateBuyerId() {
  let id = localStorage.getItem("sirius_buyer_id");
  if (!id) {
    id = "web_" + Math.random().toString(36).slice(2, 12);
    localStorage.setItem("sirius_buyer_id", id);
  }
  return id;
}

export default function ProduitPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;

  const [produit, setProduit] = useState<Produit | null>(null);
  const [chargement, setChargement] = useState(true);

  const [afficherLocalisation, setAfficherLocalisation] = useState(false);
  const [pays, setPays] = useState("");
  const [ville, setVille] = useState("");
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function chargerProduit() {
      if (!idParam) return;
      const ref = doc(db, "products", idParam);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProduit({
          id: snap.id,
          nom: data.name ?? "Produit",
          prixNombre: (data.price as number) ?? 0,
          image: (data.images && data.images[0]) || "/next.svg",
          ville: data.city ?? "",
          pays: data.country ?? "",
          categorie: data.category ?? "",
          sellerId: data.ownerId ?? data.sellerId ?? "",
        });
      }
      setChargement(false);
    }
    chargerProduit();
  }, [idParam]);

  if (chargement) {
    return (
      <div className="p-6">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="p-6">
        <p>Produit introuvable</p>
        <p className="text-sm text-gray-400">id reçu : {String(idParam)}</p>
      </div>
    );
  }

  const p = produit;

  const memeZone =
    pays.trim().toLowerCase() === p.pays.toLowerCase() &&
    ville.trim().toLowerCase() === p.ville.toLowerCase();

  function utiliserPositionActuelle() {
    if (!navigator.geolocation) {
      setErreur("La géolocalisation n'est pas supportée par ce navigateur");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setErreur(null);
      },
      () => setErreur("Autorisation de localisation refusée"),
      { enableHighAccuracy: true }
    );
  }

  async function confirmerLocalisation() {
    if (!pays.trim() || !ville.trim()) {
      setErreur("Entrez votre pays et votre ville");
      return;
    }
    if (memeZone && !position) {
      setErreur("Utilisez votre position pour continuer");
      return;
    }

    setEnCours(true);
    setErreur(null);

    const buyerId = getOrCreateBuyerId();

    const localisation = memeZone
      ? { type: "gps", latitude: position!.lat, longitude: position!.lng, ville, pays }
      : { type: "expedition", ville, pays };

    const orderRef = await addDoc(collection(db, "orders"), {
      productId: p.id,
      productName: p.nom,
      productPrice: p.prixNombre,
      sellerId: p.sellerId,
      buyerId,
      buyerLat: memeZone ? position!.lat : null,
      buyerLng: memeZone ? position!.lng : null,
      deliveryFee: 0,
      commission: 0,
      totalAmount: p.prixNombre,
      status: "enAttenteLocalisation",
      localisation,
      createdAt: serverTimestamp(),
    });

    const chatId = [buyerId, p.sellerId, p.id].sort().join("_");
    const chatRef = doc(db, "chats", chatId);

    const texteLocalisation = memeZone
      ? `📍 Ma position : https://www.google.com/maps?q=${position!.lat},${position!.lng}`
      : `📦 Livraison hors zone locale — Expédition depuis ${p.ville} vers ${ville}, ${pays}. Merci de convenir d'un point de dépôt avec le vendeur.`;

    await setDoc(
      chatRef,
      {
        participants: [buyerId, p.sellerId],
        orderId: orderRef.id,
        productId: p.id,
        productName: p.nom,
        buyerId,
        sellerId: p.sellerId,
        lastMessage: message.trim() ? message.trim() : texteLocalisation,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await addDoc(collection(chatRef, "messages"), {
      senderId: buyerId,
      text: texteLocalisation,
      createdAt: serverTimestamp(),
    });

    if (message.trim()) {
      await addDoc(collection(chatRef, "messages"), {
        senderId: buyerId,
        text: message.trim(),
        createdAt: serverTimestamp(),
      });
    }

    setEnCours(false);
    router.push(`/chat/${chatId}`);
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="bg-[#0a1f3d] flex items-center gap-3 px-6 py-4">
        <Image src="/sirius.png" alt="Sirius E-commerce" width={40} height={40} />
        <span className="text-white text-lg font-bold">Sirius E-commerce</span>
      </header>

      <div className="p-6">
        <div className="bg-gray-100 h-64 flex items-center justify-center rounded-xl mb-4 relative overflow-hidden">
          <Image
            src={p.image}
            alt={p.nom}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-[#0a1f3d]">{p.nom}</h1>
        <p className="text-orange-500 text-xl font-bold mt-1">
          {p.prixNombre.toLocaleString("fr-FR")} FCFA
        </p>

        <div className="flex gap-2 mt-3">
          <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">📍 {p.ville}</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{p.categorie}</span>
        </div>

        {!afficherLocalisation ? (
          <button
            onClick={() => setAfficherLocalisation(true)}
            className="bg-[#0a1f3d] text-white w-full py-4 rounded-full mt-6 font-bold text-base shadow-lg"
          >
            💬 Contacter le vendeur / Convenir d&apos;un rendez-vous
          </button>
        ) : (
          <div className="mt-6 border border-gray-200 rounded-2xl p-4 space-y-3">
            <h2 className="font-bold text-[#0a1f3d]">Votre localisation</h2>

            <input
              type="text"
              placeholder="Votre pays"
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2"
            />
            <input
              type="text"
              placeholder="Votre ville"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2"
            />

            {pays.trim() && ville.trim() && memeZone && (
              <button
                onClick={utiliserPositionActuelle}
                className="w-full border border-[#0a1f3d] text-[#0a1f3d] py-2 rounded-xl font-semibold"
              >
                📍 {position ? "Position enregistrée ✓" : "Utiliser ma position actuelle"}
              </button>
            )}

            {pays.trim() && ville.trim() && !memeZone && (
              <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-xl">
                Zone différente du vendeur — le produit sera expédié. Vous pourrez convenir du point de dépôt dans la discussion.
              </p>
            )}

            <textarea
              placeholder="Message (optionnel) : urgence, destination souhaitée, précisions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 min-h-[80px]"
            />

            {erreur && <p className="text-sm text-red-600">{erreur}</p>}

            <button
              onClick={confirmerLocalisation}
              disabled={enCours}
              className="bg-orange-500 text-white w-full py-3 rounded-full font-semibold disabled:opacity-60"
            >
              {enCours ? "Envoi..." : "Confirmer et contacter le vendeur"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}