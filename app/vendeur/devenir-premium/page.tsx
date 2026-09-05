"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

const IMGBB_API_KEY = "6f8d70df95ecc0b63730d3650f0fc7e1";
const PRODUIT_DEVENIR_CHAUFFEUR = "prd_uixhg2od";

async function uploadImageToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data?.data?.url) throw new Error("Échec upload image");
  return data.data.url;
}

export default function DevenirChauffeurPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [chargementAuth, setChargementAuth] = useState(true);
  const [statut, setStatut] = useState<string | null>(null);
  const [chargementStatut, setChargementStatut] = useState(true);
  const [vehicleImageUrl, setVehicleImageUrl] = useState<string | null>(null);
  const [descriptionActuelle, setDescriptionActuelle] = useState("");

  const [phone, setPhone] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [ville, setVille] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [messageOk, setMessageOk] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
      setEmail(u ? u.email : null);
      setChargementAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setChargementStatut(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "drivers", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStatut(data.status ?? null);
        setPhone((prev) => prev || data.phone || "");
        setVehicleImageUrl(data.vehicleImageUrl ?? null);
        setDescriptionActuelle(data.description ?? "");
      } else {
        setStatut(null);
      }
      setChargementStatut(false);
    });
    return () => unsub();
  }, [uid]);

  async function demarrerPaiement(telephonePourPaiement: string) {
    if (!uid || !email) {
      setErreur("Vous devez être connecté (Espace Vendeur).");
      return;
    }
    setErreur("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/chariow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: PRODUIT_DEVENIR_CHAUFFEUR,
          email,
          telephone: telephonePourPaiement,
          type: "chauffeur",
          uid,
        }),
      });
      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setErreur(data.error || "Erreur lors de la création du paiement.");
      }
    } catch (e: any) {
      setErreur(e.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!uid || !email) {
      setErreur("Vous devez être connecté (Espace Vendeur).");
      return;
    }
    if (!image || !phone.trim() || !ville.trim()) {
      setErreur("Ajoutez une photo, un numéro de téléphone et une ville.");
      return;
    }

    setIsLoading(true);
    try {
      const imageUrl = await uploadImageToImgBB(image);

      await setDoc(
        doc(db, "drivers", uid),
        {
          phone: phone.trim(),
          snapchat: snapchat.trim(),
          city: ville.trim(),
          description: description.trim(),
          vehicleImageUrl: imageUrl,
          email,
          status: "pending",
          requestedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setIsLoading(false);
      await demarrerPaiement(phone.trim());
    } catch (e: any) {
      setIsLoading(false);
      setErreur(e.message || "Une erreur est survenue.");
    }
  }

  async function handlePublierAnnonce(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setMessageOk("");
    if (!uid) return;

    setIsLoading(true);
    try {
      let urlFinale = vehicleImageUrl ?? "";
      if (image) {
        urlFinale = await uploadImageToImgBB(image);
      }

      await updateDoc(doc(db, "drivers", uid), {
        vehicleImageUrl: urlFinale,
        description: descriptionActuelle.trim(),
        updatedAt: serverTimestamp(),
      });

      setMessageOk("Annonce mise à jour ✅");
      setImage(null);
    } catch (e: any) {
      setErreur(e.message || "Erreur lors de la mise à jour.");
    } finally {
      setIsLoading(false);
    }
  }

  if (chargementAuth || chargementStatut) {
    return <div className="min-h-screen bg-[#F8F6F2] pb-40" />;
  }

  if (!uid) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] pb-40 px-4 pt-8 text-center">
        <p className="text-[#17161A]/70">Connecte-toi depuis l&apos;Espace Vendeur pour continuer.</p>
      </div>
    );
  }

  // Chauffeur actif : écran de publication/mise à jour d'annonce
  if (statut === "active") {
    return (
      <div className="min-h-screen bg-[#F8F6F2] pb-40 px-4 pt-6">
        <h1 className="text-lg font-bold text-[#17161A] mb-4">Mon annonce chauffeur</h1>

        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
            ✅ Vous êtes chauffeur actif — vous pouvez mettre à jour votre annonce.
          </div>

          <form onSubmit={handlePublierAnnonce} className="bg-white rounded-2xl border border-[#EEE8DD] p-5 space-y-4">
            <label className="w-full h-44 border border-dashed border-[#CBCBCB] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden text-gray-400">
              {image ? (
                <img src={URL.createObjectURL(image)} alt="" className="w-full h-full object-cover" />
              ) : vehicleImageUrl ? (
                <img src={vehicleImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                "+ Photo du véhicule"
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && setImage(e.target.files[0])}
              />
            </label>
            <p className="text-xs text-gray-400 text-center -mt-2">
              Touchez pour changer la photo (une seule photo publiée)
            </p>

            <textarea
              placeholder="Description (véhicule, disponibilités...)"
              value={descriptionActuelle}
              onChange={(e) => setDescriptionActuelle(e.target.value)}
              rows={4}
              className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
            />

            {erreur && <p className="text-red-500 text-xs">{erreur}</p>}
            {messageOk && <p className="text-green-600 text-xs">{messageOk}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-full disabled:opacity-60"
            >
              {isLoading ? "Publication..." : "PUBLIER"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (statut === "pending") {
    return (
      <div className="min-h-screen bg-[#F8F6F2] pb-40 px-4 pt-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#EEE8DD] p-6 text-center space-y-4">
          <p className="text-orange-600 font-semibold">
            ⏳ Votre demande est enregistrée. Terminez le paiement pour l&apos;activer.
          </p>
          <button
            onClick={() => demarrerPaiement(phone.trim() || "00000000")}
            disabled={isLoading}
            className="w-full bg-[#FF6E14] text-white font-semibold py-3 rounded-full disabled:opacity-60"
          >
            {isLoading ? "Redirection..." : "Terminer le paiement"}
          </button>
          {erreur && <p className="text-red-500 text-xs">{erreur}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-40 px-4 pt-6">
      <h1 className="text-lg font-bold text-[#17161A] mb-4">Devenir chauffeur</h1>

      <form onSubmit={handleConfirmer} className="max-w-md mx-auto bg-white rounded-2xl border border-[#EEE8DD] p-5 space-y-4">
        <label className="w-full h-40 border border-dashed border-[#CBCBCB] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden text-gray-400">
          {image ? (
            <img src={URL.createObjectURL(image)} alt="" className="w-full h-full object-cover" />
          ) : (
            "+ Photo du véhicule"
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && setImage(e.target.files[0])}
          />
        </label>

        <input
          type="tel"
          placeholder="Numéro de téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />
        <input
          type="text"
          placeholder="Snapchat (optionnel)"
          value={snapchat}
          onChange={(e) => setSnapchat(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />
        <input
          type="text"
          placeholder="Ville / zone de circulation"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />
        <textarea
          placeholder="Description (véhicule, disponibilités...)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />

        {erreur && <p className="text-red-500 text-xs">{erreur}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#FF6E14] text-white font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {isLoading ? "Envoi en cours..." : "CONFIRMER ET PAYER"}
        </button>
      </form>
    </div>
  );
}