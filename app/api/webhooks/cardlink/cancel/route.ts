import { NextRequest, NextResponse } from "next/server";
import { logWebhookEvent } from "@/lib/webhook-logger";
import { validateCardlinkPayload } from "@/lib/payload-validator";

export async function GET(req: NextRequest) {
  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  return handleCancelCallback(req, searchParams, true);
}

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

  const acceptHeader = req.headers.get("accept") || "";
  const isBrowserRedirect = acceptHeader.includes("text/html");

  return handleCancelCallback(req, payload, isBrowserRedirect);
}

async function handleCancelCallback(req: NextRequest, payload: Record<string, any>, isBrowserRedirect: boolean) {
  const start = performance.now();
  const latencyMs = Math.round(performance.now() - start);
  const merchantId = req.headers.get("x-merchant-id") || payload.mid || "9000012429";
  const validation = validateCardlinkPayload(payload, "cancel");

  await logWebhookEvent(
    "cancel",
    payload,
    merchantId,
    "success",
    validation.errors.length > 0 ? validation.errors.join("; ") : undefined,
    {
      statusCode: 200,
      latencyMs,
      validation,
      endpoint: "/api/webhooks/cardlink/cancel",
    }
  );

  // If customer browser cancelled Cardlink payment, redirect back to checkout with notice
  if (isBrowserRedirect) {
    const orderId = payload.orderid || payload.orderId || "";
    return NextResponse.redirect(
      new URL(`/checkout?cancelledOrderId=${encodeURIComponent(orderId)}&status=cancelled`, req.url)
    );
  }

  return NextResponse.json({
    received: true,
    status: "CANCELLED",
    orderid: payload.orderid || payload.orderId || null,
  });
}
