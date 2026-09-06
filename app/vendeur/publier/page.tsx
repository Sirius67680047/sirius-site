"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

const IMGBB_API_KEY = "6f8d70df95ecc0b63730d3650f0fc7e1";
const CODE_ACCES_CHINE = "240457";

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

const pays = ["Burkina Faso", "Côte d'Ivoire", "Togo", "Bénin", "Mali", "Niger", "Chine"];

type ProductAttribute = {
  key: string;
  label: string;
  type: "text" | "multiselect";
  options?: string[];
};

const couleursDisponibles = [
  "Noir", "Blanc", "Rouge", "Bleu", "Vert", "Jaune",
  "Gris", "Marron", "Rose", "Violet", "Orange", "Beige", "Multicolore",
];

const categoryAttributes: Record<string, ProductAttribute[]> = {
  "chaussures": [
    { key: "pointure", label: "Pointures disponibles", type: "multiselect", options: ["36","37","38","39","40","41","42","43","44","45","46"] },
    { key: "couleur", label: "Couleurs disponibles", type: "multiselect", options: couleursDisponibles },
  ],
  "vetements": [
    { key: "taille", label: "Tailles disponibles", type: "multiselect", options: ["XS","S","M","L","XL","XXL"] },
    { key: "couleur", label: "Couleurs disponibles", type: "multiselect", options: couleursDisponibles },
  ],
  "telephones": [
    { key: "couleur", label: "Couleurs disponibles", type: "multiselect", options: couleursDisponibles },
  ],
  "electromenager": [
    { key: "couleur", label: "Couleurs disponibles", type: "multiselect", options: couleursDisponibles },
  ],
  "mobilier": [
    { key: "couleur", label: "Couleurs disponibles", type: "multiselect", options: couleursDisponibles },
    { key: "materiau", label: "Matériau", type: "text" },
  ],
  "decoration": [
    { key: "couleur", label: "Couleurs disponibles", type: "multiselect", options: couleursDisponibles },
  ],
  "vehicules": [
    { key: "annee", label: "Année", type: "text" },
    { key: "kilometrage", label: "Kilométrage (km)", type: "text" },
  ],
  "motos-velos": [
    { key: "annee", label: "Année", type: "text" },
    { key: "kilometrage", label: "Kilométrage (km)", type: "text" },
  ],
};

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

export default function PublierProduitPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [chargementAuth, setChargementAuth] = useState(true);

  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [ville, setVille] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [paysChoisi, setPaysChoisi] = useState("Burkina Faso");
  const [codeChine, setCodeChine] = useState("");
  const [categorie, setCategorie] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  const [attributsTexte, setAttributsTexte] = useState<Record<string, string>>({});
  const [attributsMulti, setAttributsMulti] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
      setChargementAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const estEspaceChine = paysChoisi === "Chine";

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const nouveaux = Array.from(e.target.files).slice(0, 5 - images.length);
      setImages([...images, ...nouveaux].slice(0, 5));
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  function handleCategorieChange(nouvelleCategorie: string) {
    setCategorie(nouvelleCategorie);
    setAttributsTexte({});
    setAttributsMulti({});
  }

  function toggleMultiValue(key: string, valeur: string) {
    setAttributsMulti((prev) => {
      const liste = prev[key] || [];
      const dejaLa = liste.includes(valeur);
      return {
        ...prev,
        [key]: dejaLa ? liste.filter((v) => v !== valeur) : [...liste, valeur],
      };
    });
  }

  async function handlePublier(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!uid) {
      setErreur("Tu dois être connecté pour publier.");
      return;
    }
    if (!nom || !prix || !ville || !categorie || images.length === 0) {
      setErreur("Merci de remplir tous les champs obligatoires et d'ajouter au moins une image.");
      return;
    }
    if (estEspaceChine && codeChine.trim() !== CODE_ACCES_CHINE) {
      setErreur("Code d'accès incorrect pour publier dans l'espace Chine.");
      return;
    }

    setIsLoading(true);
    try {
      const urls: string[] = [];
      for (const img of images) {
        const url = await uploadImageToImgBB(img);
        urls.push(url);
      }

      const userSnap = await getDoc(doc(db, "users", uid));
      const estPremium = userSnap.data()?.isPremium === true;

      const attrsDef = categoryAttributes[categorie] || [];
      const attributesData: Record<string, string | string[]> = {};
      for (const attr of attrsDef) {
        if (attr.type === "text") {
          const v = attributsTexte[attr.key]?.trim();
          if (v) attributesData[attr.key] = v;
        } else {
          const v = attributsMulti[attr.key];
          if (v && v.length > 0) attributesData[attr.key] = v;
        }
      }

      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      );

      await addDoc(collection(db, "products"), {
        name: nom,
        price: parseFloat(prix) || 0,
        category: categorie,
        attributes: attributesData,
        city: ville,
        country: paysChoisi,
        description: description.trim(),
        images: urls,
        ownerId: uid,
        whatsapp: whatsapp.trim(),
        snapchat: snapchat.trim(),
        createdAt: serverTimestamp(),
        expiresAt,
        isPremium: estPremium,
      });

      alert("Produit publié ✅ .");
      router.push("/vendeur");
    } catch {
      setErreur("Erreur lors de la publication. Réessaie.");
    } finally {
      setIsLoading(false);
    }
  }

  if (chargementAuth) {
    return <div className="min-h-screen bg-[#F8F6F2] pb-24" />;
  }

  if (!uid) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] pb-24 px-4 pt-8 text-center">
        <p className="text-[#17161A]/70">Tu dois te connecter pour publier un produit.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-24 px-4 pt-6">
      <h1 className="text-lg font-bold text-[#17161A] mb-4">Publier un produit</h1>

      <form onSubmit={handlePublier} className="max-w-md mx-auto bg-white rounded-2xl border border-[#EEE8DD] p-5 space-y-4">
        <div>
          <label className="text-sm font-semibold text-[#17161A]">Photos (5 max)</label>
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 flex-shrink-0">
                <img
                  src={URL.createObjectURL(img)}
                  alt=""
                  className="w-20 h-20 object-cover rounded-xl border border-[#EEE8DD]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-20 h-20 flex-shrink-0 border border-dashed border-[#CBCBCB] rounded-xl flex items-center justify-center cursor-pointer text-2xl text-[#CBCBCB]">
                +
                <input type="file" accept="image/*" multiple hidden onChange={handleImagesChange} />
              </label>
            )}
          </div>
        </div>

        <input
          type="text"
          placeholder="Nom du produit"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />

        <textarea
          placeholder="Description (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />

        <input
          type="number"
          placeholder="Prix (FCFA)"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />

        <input
          type="text"
          placeholder="Ville"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />

        <input
          type="text"
          placeholder="Numéro WhatsApp (optionnel)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />

        <input
          type="text"
          placeholder="Snapchat (optionnel)"
          value={snapchat}
          onChange={(e) => setSnapchat(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        />

        <select
          value={paysChoisi}
          onChange={(e) => setPaysChoisi(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        >
          {pays.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {estEspaceChine && (
          <input
            type="password"
            placeholder="Code d'accès - Espace Chine"
            value={codeChine}
            onChange={(e) => setCodeChine(e.target.value)}
            className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
          />
        )}

        <select
          value={categorie}
          onChange={(e) => handleCategorieChange(e.target.value)}
          className="w-full border border-[#EEE8DD] rounded-xl px-4 py-3 outline-none focus:border-[#FF6E14]"
        >
          <option value="">Choisir une catégorie</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.nom}</option>
          ))}
        </select>

        {categorie && categoryAttributes[categorie] && (
          <div className="border border-[#EEE8DD] rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold text-[#17161A]">Détails du produit</p>
            {categoryAttributes[categorie].map((attr) => (
              <div key={attr.key}>
                <p className="text-xs font-semibold text-[#17161A]/70 mb-2">{attr.label}</p>
                {attr.type === "multiselect" ? (
                  <div className="flex flex-wrap gap-2">
                    {(attr.options || []).map((opt) => {
                      const selected = (attributsMulti[attr.key] || []).includes(opt);
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => toggleMultiValue(attr.key, opt)}
                          className={`px-3 py-1.5 rounded-full text-xs border ${
                            selected
                              ? "bg-[#FF6E14] text-white border-[#FF6E14]"
                              : "border-[#EEE8DD] text-[#17161A]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={attributsTexte[attr.key] || ""}
                    onChange={(e) =>
                      setAttributsTexte((prev) => ({ ...prev, [attr.key]: e.target.value }))
                    }
                    className="w-full border border-[#EEE8DD] rounded-xl px-4 py-2 outline-none focus:border-[#FF6E14] text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {erreur && <p className="text-red-500 text-xs">{erreur}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#FF6E14] text-white font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {isLoading ? "Publication en cours..." : "PUBLIER"}
        </button>
      </form>
    </div>
  );
}