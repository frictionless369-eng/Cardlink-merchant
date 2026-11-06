import { NextRequest, NextResponse } from "next/server";
import { logWebhookEvent } from "../../../../../lib/webhook-logger";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const merchantId = req.headers.get("x-merchant-id") || "unknown";

  await logWebhookEvent("payment", payload, merchantId, "success");
  return NextResponse.json({ received: true }, { status: 200 });
}
