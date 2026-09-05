import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.chariow.com/v1/checkout";

export async function POST(req: NextRequest) {
  try {
    const { productId, email, telephone, type, uid } = await req.json();
    if (!productId || !email || !telephone || !type) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHARIOW_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        email,
        first_name: "Client",
        last_name: "Sirius",
        phone: { number: telephone, country_code: "BF" },
        custom_metadata: { uid: uid || "", type },
      }),
    });

    const data = await response.json();
    if (response.ok && data?.data?.step === "payment") {
      return NextResponse.json({ checkoutUrl: data.data.payment.checkout_url });
    }
    return NextResponse.json(
      { error: data?.message || "Erreur lors de la création du paiement" },
      { status: 400 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}