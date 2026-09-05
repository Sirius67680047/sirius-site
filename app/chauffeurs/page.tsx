"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

type Chauffeur = {
  id: string;
  city: string;
  phone: string;
  description: string;
  vehicleImageUrl: string;
};

function nettoyerNumero(numero: string) {
  return numero.replace(/[^\d+]/g, "");
}

export default function ChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [selectionne, setSelectionne] = useState<Chauffeur | null>(null);

  useEffect(() => {
    const q = query(collection(db, "drivers"), where("status", "==", "active"));
    const unsub = onSnapshot(q, (snap) => {
      setChauffeurs(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            city: data.city ?? "",
            phone: data.phone ?? "",
            description: data.description ?? "",
            vehicleImageUrl: data.vehicleImageUrl ?? "",
          };
        })
      );
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-40">
      <header className="bg-[#0B0B10] px-4 py-4">
        <h1 className="text-white font-bold text-lg">Contacter un chauffeur</h1>
      </header>

      <div className="p-4 grid grid-cols-2 gap-4">
        {chauffeurs.length === 0 && (
          <p className="col-span-2 text-center text-[#17161A]/50 mt-10">
            Aucun chauffeur disponible pour le moment
          </p>
        )}
        {chauffeurs.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectionne(c)}
            className="bg-white rounded-2xl overflow-hidden shadow text-left"
          >
            <div className="h-32 bg-gray-100">
              {c.vehicleImageUrl ? (
                <img src={c.vehicleImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">🚗</div>
              )}
            </div>
            <p className="text-xs font-bold px-2 py-2">{c.city}</p>
          </button>
        ))}
      </div>

      {selectionne && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
          onClick={() => setSelectionne(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-44 rounded-xl overflow-hidden bg-gray-100">
              {selectionne.vehicleImageUrl && (
                <img src={selectionne.vehicleImageUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <p className="font-bold">📍 {selectionne.city}</p>
            {selectionne.description && <p>{selectionne.description}</p>}

            <a
              href={`tel:${selectionne.phone}`}
              className="block text-center w-full bg-green-600 text-white font-semibold py-3 rounded-full"
            >
              📞 Appeler {selectionne.phone}
            </a>
            <a
              href={`https://wa.me/${nettoyerNumero(selectionne.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full bg-[#25D366] text-white font-semibold py-3 rounded-full"
            >
              Contacter sur WhatsApp
            </a>

            <button
              onClick={() => setSelectionne(null)}
              className="w-full text-gray-500 text-sm py-2"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}