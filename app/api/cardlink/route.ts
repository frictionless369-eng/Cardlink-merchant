import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { sanitizeFirestoreData } from "@/lib/webhook-logger";

/**
 * Cardlink Virtual POS (VPOS) Payment Initiation Endpoint
 *
 * Implements the official Cardlink / Eurobank Modirum redirection specification (vpos/shophandlermpi).
 *
 * Digest Formula:
 * Digest = Base64( SHA-256( UTF-8( version + mid + lang + orderid + orderDesc + orderAmount + currency + payerEmail + confirmUrl + cancelUrl + sharedSecret ) ) )
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const secret = process.env.CARDLINK_SECRET || "Cardlink1";
    const mid = process.env.CARDLINK_MERCHANT_ID || "9000012429";
    const primaryUrl = process.env.CARDLINK_PRIMARY_URL || "https://eurocommerce-test.cardlink.gr/vpos/shophandlermpi";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cardlink-merchant.vercel.app";

    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const orderId = body.orderId || "clk_" + Date.now() + "_" + randomArray[0].toString(36).slice(0, 4);
    const orderAmount = body.amount ? Number(body.amount).toFixed(2) : "75.00";
    const currency = body.currency || "EUR";
    const lang = body.lang || "en";
    const orderDesc = body.orderDesc || body.roomName || "Luxury Resort Suite Reservation";
    const payerEmail = body.email || "frictionless369@gmail.com";
    const confirmUrl = `${baseUrl}/api/webhooks/cardlink/payment`;
    const cancelUrl = `${baseUrl}/api/webhooks/cardlink/cancel`;
    const version = "2";

    // Strict Cardlink MPI form fields for shophandlermpi
    const formFields: Record<string, string> = {
      version,
      mid,
      lang,
      orderid: orderId,
      orderDesc,
      orderAmount,
      currency,
      payerEmail,
      confirmUrl,
      cancelUrl,
    };

    // Calculate official Cardlink SHA-256 Base64 digest:
    const rawStringToSign = Object.values(formFields).join("") + secret;
    const digest = crypto.createHash("sha256").update(rawStringToSign, "utf8").digest("base64");

    // Persist pending transaction ledger record in Firestore
    const merchantId = req.headers.get("x-merchant-id") || mid;
    const txDoc = sanitizeFirestoreData({
      id: orderId,
      date: new Date().toISOString(),
      amount: parseFloat(orderAmount),
      currency,
      status: "Pending",
      type: "payment",
      gateway: "CARDLINK_VPOS",
      entryMethod: "HOSTED_REDIRECT",
      merchantId,
      digestCalculated: digest,
    });

    await addDoc(collection(db, "transactions"), txDoc);

    return NextResponse.json({
      success: true,
      gateway: "CARDLINK",
      endpointUrl: primaryUrl,
      orderId,
      formFields: {
        ...formFields,
        digest,
      },
      // Direct checkout URL for button redirects
      redirectUrl: `${primaryUrl}?mid=${encodeURIComponent(mid)}&orderid=${encodeURIComponent(orderId)}&orderAmount=${encodeURIComponent(orderAmount)}&currency=${encodeURIComponent(currency)}&digest=${encodeURIComponent(digest)}`,
    });
  } catch (error: any) {
    console.error("Cardlink payment initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Cardlink payment", details: error.message },
      { status: 500 }
    );
  }
}
