import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logWebhookEvent } from "@/lib/webhook-logger";

interface StoredCheckout {
  checkoutId: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  status: "INITIATED" | "PENDING" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  transactionId?: string;
  paymentToken?: string;
  createdAt: string;
}

// Global cache for simulated CTP sessions
declare global {
  var _ctpSessions: Map<string, StoredCheckout> | undefined;
}
if (!global._ctpSessions) {
  global._ctpSessions = new Map<string, StoredCheckout>();
}

/**
 * Visa Click to Pay (CTP) Checkout Initiation
 * Path: /visasrci/v1/checkout
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      merchantId = "9000012429",
      amount,
      currency = "EUR",
      consumerIdentity,
      merchantName = "Luxury Resort & Spa",
      returnUrl = "https://cardlink-merchant.vercel.app/checkout",
    } = body;

    const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount || "0");
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        {
          errorCode: "INVALID_AMOUNT",
          message: "Amount must be a positive number",
          details: [{ field: "amount", message: "Required positive number" }],
        },
        { status: 400 }
      );
    }

    const checkoutId = `ctp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const checkoutUrl = `https://sandbox.secure.checkout.visa.com/checkout?id=${encodeURIComponent(
      checkoutId
    )}&mid=${encodeURIComponent(merchantId)}`;

    const session: StoredCheckout = {
      checkoutId,
      merchantId,
      merchantName,
      amount: parsedAmount,
      currency,
      status: "INITIATED",
      transactionId: `TX_CTP_${Date.now()}`,
      paymentToken: `TKN_VISA_${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    global._ctpSessions!.set(checkoutId, session);

    // Audit log
    await logWebhookEvent(
      "visa_ctp_initiate",
      {
        checkoutId,
        merchantId,
        amount: parsedAmount,
        currency,
        consumerIdentity,
      },
      merchantId,
      "success",
      undefined,
      {
        statusCode: 200,
        latencyMs: 65,
        endpoint: "/visasrci/v1/checkout",
      }
    );

    return NextResponse.json(
      {
        checkoutId,
        status: "INITIATED",
        checkoutUrl,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { errorCode: "SERVER_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
