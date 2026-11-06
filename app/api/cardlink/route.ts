import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "../../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const secret = process.env.CARDLINK_SECRET;
  
  // Example Cardlink specification logic
  const orderId = "clk_" + Math.random().toString(36).substring(7);
  const amount = "7500"; // Amount in cents
  
  // Calculate security digest
  const dataToSign = `${orderId}${amount}${secret}`;
  const digest = crypto.createHmac("sha256", secret || "").update(dataToSign).digest("hex");
  
  console.log("Initiating Cardlink payment for order:", orderId, "at URL:", process.env.CARDLINK_PRIMARY_URL);

  await addDoc(collection(db, "transactions"), {
    id: orderId,
    date: new Date().toISOString(),
    amount: parseFloat(amount) / 100,
    status: "Pending",
    merchantId: req.headers.get("x-merchant-id") || "unknown"
  });

  return NextResponse.json({
    redirectUrl: `https://redirect.cardlink.gr/payment?order_id=${orderId}&amount=${amount}&digest=${digest}`,
  });
}
