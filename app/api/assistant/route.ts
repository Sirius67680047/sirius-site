import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../../../lib/firebase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EMAIL_CONTACT = "siriusecommerce.bf@gmail.com";
const TEL_CONTACT = "+226 53 00 90 91 (WhatsApp +226 67 68 00 47)";

async function fetchProduits() {
  const q = query(collection(db, "products"), limit(200));
  const snap = await getDocs(q);

  const produits = snap.docs.map((d) => {
    const data = d.data();
    const images: string[] = data.images || [];
    return {
      id: d.id,
      nom: data.name ?? "",
      description: data.description ?? "",
      prix: data.price ?? 0,
      ville: data.city ?? "",
      pays: data.country ?? "",
      categorie: data.category ?? "",
      photoUrl: images[0] ?? "",
      ownerId: data.ownerId ?? "",
    };
  });

  return produits;
}

function buildPrompt(produits: any[], nouveauMessage: string, historique: { user: string; ai: string }[]) {
  const produitsPourIA = produits.map(({ photoUrl, ownerId, ...rest }) => rest);
  const catalogueJson = JSON.stringify(produitsPourIA);

  const systemPrompt = `
Tu es Sirius Assistant, l'assistant EXCLUSIF de l'application Sirius E-commerce.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en français, quelle que soit la langue utilisée par le client.
2. Tu ne réponds JAMAIS à une question sans rapport avec Sirius E-commerce. Réponds alors exactement : "Je ne peux répondre qu'aux questions concernant Sirius E-commerce."
3. Voici le catalogue RÉEL et COMPLET des produits actuellement disponibles (JSON) :
${catalogueJson}
4. Ne parle JAMAIS d'un produit absent de cette liste. Si rien ne correspond, dis-le clairement, n'invente rien.
5. Pour VENDRE : le vendeur va dans "Espace Vendeur" et ajoute son produit.
6. Pour ACHETER : le client clique sur le produit puis "Acheter", indique son pays/ville. Si même ville que le vendeur, ce dernier livre en main propre contre paiement après validation. Sinon, livraison par transporteur à organiser entre client et vendeur.
7. Contact support : email ${EMAIL_CONTACT}, téléphone ${TEL_CONTACT}.
8. Tiens compte de l'historique de la conversation ci-dessous pour comprendre le contexte.
9. Réponds TOUJOURS et UNIQUEMENT au format JSON strict suivant, sans texte avant/après, sans balises markdown :
{"message": "ta réponse conversationnelle ici", "produits_ids": ["id1", "id2"]}
`;

  let historiqueTexte = "";
  if (historique.length > 0) {
    historiqueTexte = "\nHistorique de la conversation :\n";
    for (const tour of historique) {
      historiqueTexte += `Client : ${tour.user}\nSirius Assistant : ${tour.ai}\n`;
    }
  }

  return `${systemPrompt}${historiqueTexte}\nNouveau message du client : ${nouveauMessage}`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, historique } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message manquant" }, { status: 400 });
    }

    const produits = await fetchProduits();
    const prompt = buildPrompt(produits, message, historique || []);

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);

    let raw = (result.response.text() || '{"message":"","produits_ids":[]}').trim();
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed: { message: string; produits_ids: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw, produits_ids: [] };
    }

    const produitsAffiches = produits.filter((p) =>
      (parsed.produits_ids || []).includes(p.id)
    );

    return NextResponse.json({
      message: parsed.message,
      produits: produitsAffiches,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Le serveur est momentanément surchargé. Réessaie." },
      { status: 500 }
    );
  }
}