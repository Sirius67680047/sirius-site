"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

type Produit = {
  id: string;
  nom: string;
  prix: number;
  ville: string;
  photoUrl: string;
};

type ChatMessage = {
  role: "user" | "ai";
  text: string;
  produits?: Produit[];
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Bonjour 👋 Je suis Sirius Assistant. Pose-moi une question sur nos produits !" },
  ]);
  const [texte, setTexte] = useState("");
  const [chargement, setChargement] = useState(false);
  const historiqueRef = useRef<{ user: string; ai: string }[]>([]);

  async function envoyer() {
    const message = texte.trim();
    if (!message || chargement) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setTexte("");
    setChargement(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, historique: historiqueRef.current }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: "ai", text: data.error }]);
      } else {
        historiqueRef.current.push({ user: message, ai: data.message });
        if (historiqueRef.current.length > 10) historiqueRef.current.shift();
        setMessages((prev) => [...prev, { role: "ai", text: data.message, produits: data.produits }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Erreur de connexion. Réessaie." }]);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col pb-32">
      <header className="bg-gradient-to-r from-[#0B0B10] to-[#2C1C10] px-4 py-4 text-white font-bold text-center">
        Sirius Assistant
      </header>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "ai" ? "justify-start" : "justify-end"}`}>
            <div className="max-w-[85%]">
              <div
                className={`px-4 py-3 rounded-2xl text-sm shadow ${
                  m.role === "ai"
                    ? "bg-white text-black rounded-bl-none"
                    : "bg-[#0B0B10] text-white rounded-br-none"
                }`}
              >
                {m.text}
              </div>

              {m.produits && m.produits.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mt-2">
                  {m.produits.map((p) => (
                    <Link
                      key={p.id}
                      href={`/produit/${p.id}`}
                      className="w-36 flex-shrink-0 bg-white rounded-xl shadow overflow-hidden"
                    >
                      <div className="relative h-24 w-full bg-gray-100">
                        <Image
                          src={p.photoUrl || "/next.svg"}
                          alt={p.nom}
                          fill
                          sizes="144px"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-bold truncate">{p.nom}</p>
                        <p className="text-xs text-orange-500">{p.prix.toLocaleString("fr-FR")} FCFA</p>
                        <p className="text-[10px] text-gray-500">{p.ville}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {chargement && <p className="text-sm text-gray-400">Sirius Assistant écrit...</p>}
      </div>

      <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && envoyer()}
          placeholder="Pose ta question..."
          className="flex-1 bg-[#F3F3F3] rounded-full px-4 py-2 outline-none"
        />
        <button
          onClick={envoyer}
          disabled={chargement}
          className="bg-gradient-to-r from-[#FF6E14] to-[#CB9A46] text-white rounded-full px-5 font-semibold disabled:opacity-60"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}