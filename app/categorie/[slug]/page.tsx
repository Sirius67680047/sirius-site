"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useParams } from "next/navigation";

const categories = [
  { nom: "Chaussures", slug: "chaussures" },
  { nom: "Vêtements", slug: "vetements" },
  { nom: "Téléphones", slug: "telephones" },
  { nom: "Informatique", slug: "informatique" },
  { nom: "Électronique", slug: "electronique" },
  { nom: "Électroménager", slug: "electromenager" },
  { nom: "Mobilier", slug: "mobilier" },
  { nom: "Décoration", slug: "decoration" },
  { nom: "Restauration", slug: "restauration" },
  { nom: "Véhicules", slug: "vehicules" },
  { nom: "Motos & Vélos", slug: "motos-velos" },
  { nom: "Beauté et bien-être", slug: "beaute-bien-etre" },
  { nom: "Autre", slug: "autre" },
];

type Produit = {
  id: string;
  name: string;
  price: number;
  images?: string[];
  isPremium?: boolean;
};

export default function CategoriePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);

  const categorie = categories.find((c) => c.slug === slug);

  useEffect(() => {
    async function fetchProduits() {
      try {
        const q = query(collection(db, "products"), where("category", "==", slug));
        const snap = await getDocs(q);
        setProduits(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name,
            price: d.data().price,
            images: d.data().images,
            isPremium: d.data().isPremium,
          }))
        );
      } catch (err) {
        console.error("Erreur chargement produits :", err);
      } finally {
        setChargement(false);
      }
    }
    fetchProduits();
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-20 px-4 pt-8">
      <Link href="/" className="text-[#FF6E14] text-sm font-semibold mb-4 inline-block">
        ← Retour
      </Link>
      <h1 className="text-xl font-bold text-[#17161A] mb-6">
        {categorie ? categorie.nom : "Catégorie"}
      </h1>

      {chargement ? (
        <p className="text-sm text-[#17161A]/60">Chargement...</p>
      ) : produits.length === 0 ? (
        <p className="text-sm text-[#17161A]/60">Aucun produit dans cette catégorie pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {produits.map((produit) => (
            <Link
              key={produit.id}
              href={`/produit/${produit.id}`}
              className="bg-white rounded-2xl overflow-hidden block border border-[#EEE8DD]"
            >
              <div className="bg-[#EEE8DD] h-32 flex items-center justify-center relative">
                {produit.images?.[0] && (
                  <Image src={produit.images[0]} alt={produit.name} fill className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{produit.name}</p>
                <p className="text-[#FF6E14] font-bold mt-1">
                  {produit.price.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}