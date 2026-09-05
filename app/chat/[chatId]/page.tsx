"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
};

type ChatInfo = {
  productId: string;
  productName: string;
  buyerId: string;
  sellerId: string;
};

type SellerContact = {
  phone: string | null;
  snapchat: string | null;
};

function nettoyerNumero(numero: string) {
  // garde uniquement les chiffres et le +
  return numero.replace(/[^\d+]/g, "");
}

function IconeWhatsApp() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        d="M23.5 8.5C21.6 6.6 19 5.5 16.2 5.5c-5.7 0-10.4 4.6-10.4 10.4 0 1.8.5 3.6 1.4 5.2L5.5 26.5l5.5-1.4c1.5.8 3.2 1.3 5 1.3h0c5.7 0 10.4-4.6 10.4-10.4 0-2.8-1.1-5.4-3-7.5zM16.2 24.4h0c-1.6 0-3.1-.4-4.5-1.2l-.3-.2-3.3.9.9-3.2-.2-.3c-.9-1.4-1.4-3.1-1.4-4.8 0-4.9 4-8.9 8.9-8.9 2.4 0 4.6.9 6.3 2.6 1.7 1.7 2.6 3.9 2.6 6.3-.1 4.9-4.1 8.8-9 8.8zm4.9-6.6c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.2-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.1-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.1.1-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.4 3.9 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.2-.2-.2-.5-.3z"
        fill="white"
      />
    </svg>
  );
}

function IconeSnapchat() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#FFFC00" />
      <path
        d="M16 7c-2.9 0-4.5 2-4.5 4.4 0 .6.1 1.3.1 1.9-.1 0-.2.1-.4.1-.6 0-1.1-.4-1.4-.4-.3 0-.6.2-.6.6 0 .5.6.8 1.2 1.1.2.1.3.2.3.4-.1.5-.4 1.6-1.5 2.9-.2.2-.6.4-1.2.6-.3.1-.5.3-.5.6 0 .5.7.7 1.6 1 .1.2.2.5.3.8.1.3.4.5.9.5.4 0 .9-.1 1.4-.1.7 0 1.2.5 2.5 1.1.6.3 1.3.5 2 .5s1.4-.2 2-.5c1.3-.6 1.8-1.1 2.5-1.1.5 0 1 .1 1.4.1.5 0 .8-.2.9-.5.1-.3.2-.6.3-.8.9-.3 1.6-.5 1.6-1 0-.3-.2-.5-.5-.6-.6-.2-1-.4-1.2-.6-1.1-1.3-1.4-2.4-1.5-2.9 0-.2.1-.3.3-.4.6-.3 1.2-.6 1.2-1.1 0-.4-.3-.6-.6-.6-.3 0-.8.4-1.4.4-.2 0-.3 0-.4-.1 0-.6.1-1.3.1-1.9C20.5 9 18.9 7 16 7z"
        fill="black"
      />
    </svg>
  );
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [contact, setContact] = useState<SellerContact>({ phone: null, snapchat: null });
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  const buyerId =
    typeof window !== "undefined" ? localStorage.getItem("sirius_buyer_id") : null;

  const finRef = useRef<HTMLDivElement>(null);

  // Charger les infos du chat + du produit (whatsapp / snapchat du vendeur)
  useEffect(() => {
    async function charger() {
      if (!chatId) return;
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        setChargement(false);
        return;
      }
      const data = chatSnap.data();
      const info: ChatInfo = {
        productId: data.productId,
        productName: data.productName,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
      };
      setChatInfo(info);

      if (info.productId) {
        const produitRef = doc(db, "products", info.productId);
        const produitSnap = await getDoc(produitRef);
        if (produitSnap.exists()) {
          const p = produitSnap.data();
          setContact({
            phone: p.whatsapp || null,
            snapchat: p.snapchat || null,
          });
        }
      }
      setChargement(false);
    }
    charger();
  }, [chatId]);

  // Écoute en temps réel des messages
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Message, "id">),
        }))
      );
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyerMessage() {
    if (!texte.trim() || !chatId || !buyerId) return;
    setEnvoi(true);
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: buyerId,
      text: texte.trim(),
      createdAt: serverTimestamp(),
    });
    setTexte("");
    setEnvoi(false);
  }

  if (chargement) {
    return (
      <div className="p-6">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!chatInfo) {
    return (
      <div className="p-6">
        <p>Discussion introuvable</p>
      </div>
    );
  }

  const lienWhatsApp = contact.phone
    ? `https://wa.me/${nettoyerNumero(contact.phone)}`
    : null;
  const lienSnapchat = contact.snapchat
    ? `https://www.snapchat.com/add/${contact.snapchat.replace("@", "")}`
    : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-[#0a1f3d] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white text-xl">
            ←
          </button>
          <span className="text-white font-bold truncate max-w-[150px]">
            {chatInfo.productName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {lienWhatsApp && (
            <a
              href={lienWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              title="Contacter sur WhatsApp"
              className="flex items-center justify-center"
            >
              <IconeWhatsApp />
            </a>
          )}
          {lienSnapchat && (
            <a
              href={lienSnapchat}
              target="_blank"
              rel="noopener noreferrer"
              title="Contacter sur Snapchat"
              className="flex items-center justify-center"
            >
              <IconeSnapchat />
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m) => {
          const estMoi = m.senderId === buyerId;
          return (
            <div
              key={m.id}
              className={`flex ${estMoi ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  estMoi
                    ? "bg-[#0a1f3d] text-white rounded-br-sm"
                    : "bg-white border border-gray-200 rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <div className="p-3 border-t border-gray-200 flex items-center gap-2">
        <input
          type="text"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
          placeholder="Écrire un message..."
          className="flex-1 border border-gray-200 rounded-full px-4 py-2"
        />
        <button
          onClick={envoyerMessage}
          disabled={envoi}
          className="bg-orange-500 text-white rounded-full px-5 py-2 font-semibold disabled:opacity-60"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}