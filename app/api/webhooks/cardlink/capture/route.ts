import { NextRequest, NextResponse } from "next/server";
import { logWebhookEvent } from "@/lib/webhook-logger";

export async function POST(req: NextRequest) {
  let payload: any = {};
  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { rawBody: text };
      }
    }
  } catch (err: any) {
    payload = { error: err.message };
  }

  const merchantId = req.headers.get("x-merchant-id") || payload.mid || "9000012429";

  await logWebhookEvent("capture", payload, merchantId, "success");
  return NextResponse.json({ received: true }, { status: 200 });
}
