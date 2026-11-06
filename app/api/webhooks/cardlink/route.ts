import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const merchantId = req.headers.get("x-merchant-id") || "unknown"; // In reality, infer from merchantId in payload/auth

  try {
    await addDoc(collection(db, "webhook_logs"), {
      timestamp: new Date().toISOString(),
      status: "success",
      event: payload.event || "payment_callback",
      payload,
      merchantId,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    await addDoc(collection(db, "webhook_logs"), {
      timestamp: new Date().toISOString(),
      status: "failure",
      event: payload.event || "payment_callback",
      payload,
      error: String(error),
      merchantId,
    });
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
