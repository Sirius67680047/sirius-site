"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const categories = [
  { nom: "Chaussures", slug: "chaussures", icone: "/cat_chaussures.png" },
  { nom: "Vêtements", slug: "vetements", icone: "/cat_vetements.png" },
  { nom: "Téléphones", slug: "telephones", icone: "/cat_telephones.png" },
  { nom: "Informatique", slug: "informatique", icone: "/cat_informatique.png" },
  { nom: "Électronique", slug: "electronique", icone: "/cat_electronique.png" },
  { nom: "Électroménager", slug: "electromenager", icone: "/cat_electromenager.png" },
  { nom: "Mobilier", slug: "mobilier", icone: "/cat_mobilier.png" },
  { nom: "Décoration", slug: "decoration", icone: "/cat_decoration.png" },
  { nom: "Restauration", slug: "restauration", icone: "/cat_restauration.png" },
  { nom: "Véhicules", slug: "vehicules", icone: "/cat_vehicules.png" },
  { nom: "Motos & Vélos", slug: "motos-velos", icone: "/cat_motos.png" },
  { nom: "Beauté et bien-être", slug: "beaute-bien-etre", icone: "/cat_beaute.png" },
  { nom: "Autre", slug: "autre", icone: "/cat_autre.png" },
];

const paysDisponibles = ["Burkina Faso", "Côte d'Ivoire", "Togo", "Bénin", "Mali", "Niger"];

const bannieres = ["/banner1-v2.png", "/banner2-v2.png", "/banner3-v2.png"];

function BannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % bannieres.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-4 mt-4">
      <div className="rounded-2xl overflow-hidden h-40 sm:h-52 relative bg-gradient-to-br from-[#0B0B10] via-[#201823] to-[#2C1C10]">
        {bannieres.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={src}
              alt={`Bannière ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {bannieres.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-[#CB9A46]" : "w-1.5 bg-[#EEE8DD]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

type Produit = {
  id: string;
  name: string;
  price: number;
  images?: string[];
  isPremium?: boolean;
  country?: string;
};

export default function Home() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [paysUtilisateur, setPaysUtilisateur] = useState<string | null>(null);
  const [afficherChoixPays, setAfficherChoixPays] = useState(false);

  useEffect(() => {
    const stocke = localStorage.getItem("sirius_pays_utilisateur");
    if (stocke) {
      setPaysUtilisateur(stocke);
    } else {
      setAfficherChoixPays(true);
    }
  }, []);

  function choisirPays(pays: string) {
    localStorage.setItem("sirius_pays_utilisateur", pays);
    setPaysUtilisateur(pays);
    setAfficherChoixPays(false);
  }

  useEffect(() => {
    async function fetchProduits() {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(30));
        const snap = await getDocs(q);
        setProduits(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name,
            price: d.data().price,
            images: d.data().images,
            isPremium: d.data().isPremium,
            country: d.data().country,
          }))
        );
      } catch (err) {
        console.error("Erreur chargement produits :", err);
      }
    }
    fetchProduits();
  }, []);

  const produitsInternationaux = paysUtilisateur
    ? produits.filter((p) => p.country && p.country !== paysUtilisateur)
    : [];

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-20">
      {/* Sélecteur de pays au premier passage */}
      {afficherChoixPays && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-bold text-[#17161A] mb-1">Ton pays</h2>
            <p className="text-sm text-[#17161A]/60 mb-4">
              Pour te montrer les bons produits nationaux et internationaux.
            </p>
            <div className="space-y-2">
              {paysDisponibles.map((p) => (
                <button
                  key={p}
                  onClick={() => choisirPays(p)}
                  className="w-full text-left px-4 py-2 rounded-xl border border-[#EEE8DD] hover:border-[#FF6E14]"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <header className="bg-[#0B0B10] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11">
            <Image src="/sirius.png" alt="Sirius E-commerce" fill className="object-contain" />
          </div>
          <span className="text-white text-xl font-bold">
            <span className="text-[#CB9A46]">Sirius</span> E-commerce
          </span>
        </div>
        <div className="bg-[#EEE8DD] p-2 rounded-full">🔔</div>
      </header>

      <BannerCarousel />

      {/* Barre de recherche */}
      <div className="px-4 py-4">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          className="w-full border border-[#EEE8DD] bg-white rounded-2xl px-5 py-3 outline-none focus:border-[#FF6E14] shadow-sm"
        />
      </div>

      {/* Bandeau Sirius Assistant */}
      <Link
        href="/assistant"
        className="mx-4 mb-3 bg-gradient-to-br from-[#0B0B10] via-[#201823] to-[#2C1C10] border border-[#CB9A46]/40 rounded-2xl px-4 py-3 flex items-center gap-3"
      >
        <div className="bg-gradient-to-r from-[#FF6E14] to-[#CB9A46] p-2 rounded-full text-lg">✨</div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Demander à Sirius Assistant</p>
          <p className="text-[#EFD9A6] text-xs">Recherche intelligente, conseils & comparatifs...</p>
        </div>
        <span className="text-[#CB9A46]">›</span>
      </Link>

      {/* Bandeau Contacter un chauffeur */}
      <Link
        href="/chauffeurs"
        className="mx-4 mb-6 bg-gradient-to-r from-[#0E6B57] to-[#12A57F] rounded-2xl px-4 py-3 flex items-center gap-3"
      >
        <div className="bg-white/20 p-2 rounded-full text-lg">🚕</div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Contacter un chauffeur pour vos courses</p>
        </div>
        <span className="text-white">›</span>
      </Link>

      {/* Catégories */}
      <div className="pb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-bold text-[#17161A]">Catégories</h2>
          <span className="text-[#FF6E14] text-sm font-semibold">Tout voir</span>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categorie/${cat.slug}`}
              className="flex flex-col items-center gap-2 flex-shrink-0 w-16"
            >
              <div className="bg-[#0B0B10] w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden relative">
                <div className="relative w-7 h-7">
                  <Image src={cat.icone} alt={cat.nom} fill className="object-contain" />
                </div>
              </div>
              <span className="text-xs font-medium text-center text-[#17161A]">{cat.nom}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Produits internationaux (dynamique, basé sur le pays choisi) */}
      <div className="pb-6">
        <div className="flex items-center gap-2 px-4 mb-3">
          <span>🌍</span>
          <h2 className="text-lg font-bold text-[#17161A]">Produits internationaux</h2>
        </div>
        {produitsInternationaux.length === 0 ? (
          <p className="text-sm text-[#17161A]/50 px-4">
            Aucun produit international pour le moment.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto px-4 pb-2">
            {produitsInternationaux.map((p) => (
              <Link
                key={p.id}
                href={`/produit/${p.id}`}
                className="flex-shrink-0 w-36 border border-[#EEE8DD] rounded-2xl overflow-hidden bg-white block"
              >
                <div className="bg-[#EEE8DD] h-24 flex items-center justify-center relative">
                  {p.images?.[0] && (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-[#FF6E14] text-sm font-bold">{p.price.toLocaleString("fr-FR")} FCFA</p>
                  <span className="inline-block mt-1 bg-[#0E6B57]/10 text-[#0E6B57] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    📍 {p.country}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Nos Produits */}
      <main className="px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-[#17161A]">Nos Produits</h1>
          <span className="flex items-center gap-1 bg-[#0E6B57]/10 text-[#0E6B57] text-xs font-bold px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E6B57]"></span> En direct
          </span>
        </div>

        {produits.length === 0 ? (
          <p className="text-sm text-[#17161A]/60 text-center mt-6">
            Aucun produit publié pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {produits.map((produit) => (
              <Link
                key={produit.id}
                href={`/produit/${produit.id}`}
                className={`bg-white rounded-2xl overflow-hidden block border ${
                  produit.isPremium ? "border-2 border-[#1877F2] shadow-md" : "border-[#EEE8DD]"
                }`}
              >
                <div className="bg-[#EEE8DD] h-32 flex items-center justify-center relative">
                  {produit.images?.[0] && (
                    <Image src={produit.images[0]} alt={produit.name} fill className="object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate">{produit.name}</span>
                    {produit.isPremium && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2" className="flex-shrink-0">
                        <path d="M12 1l2.39 2.39 3.3-.36.36 3.3L21 9l-2.39 2.39L21 15l-3.3.36-.36 3.3-3.3-.36L12 21l-2.04-2.7-3.3.36-.36-3.3L3 12l2.04-2.61-.36-3.3 3.3.36L12 1z" />
                        <path d="M10.2 15.6l-3-3 1.2-1.2 1.8 1.8 4.6-4.6 1.2 1.2z" fill="white" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[#FF6E14] font-bold mt-1">
                    {produit.price.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}