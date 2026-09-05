"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

type Produit = {
  id: string;
  name: string;
  price: number;
  images?: string[];
};

export default function ChinePage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function fetchProduitsChine() {
      try {
        const q = query(
          collection(db, "products"),
          where("country", "==", "Chine"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setProduits(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name,
            price: d.data().price,
            images: d.data().images,
          }))
        );
      } catch (err) {
        console.error("Erreur chargement produits Chine :", err);
      } finally {
        setChargement(false);
      }
    }
    fetchProduitsChine();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-24 px-4 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <span>🌍</span>
        <h1 className="text-lg font-bold text-[#17161A]">Produits de Chine</h1>
      </div>

      {chargement ? (
        <p className="text-sm text-[#17161A]/60 text-center mt-10">Chargement...</p>
      ) : produits.length === 0 ? (
        <p className="text-sm text-[#17161A]/60 text-center mt-10">
          Aucun produit chinois publié pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {produits.map((p) => (
            <Link
              key={p.id}
              href={`/produit/${p.id}`}
              className="bg-white rounded-2xl overflow-hidden block border border-[#EEE8DD]"
            >
              <div className="bg-[#EEE8DD] h-32 flex items-center justify-center relative">
                {p.images?.[0] && (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{p.name}</p>
                <p className="text-[#FF6E14] font-bold mt-1">{p.price.toLocaleString("fr-FR")} FCFA</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}