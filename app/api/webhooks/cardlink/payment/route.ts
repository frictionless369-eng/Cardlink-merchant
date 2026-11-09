import { NextRequest, NextResponse } from "next/server";
import { logWebhookEvent } from "@/lib/webhook-logger";
import { validateCardlinkPayload } from "@/lib/payload-validator";

export async function GET(req: NextRequest) {
  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  return handlePaymentCallback(req, searchParams, true);
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

  // Check if request is direct API JSON call or user browser returning via POST form
  const acceptHeader = req.headers.get("accept") || "";
  const isBrowserRedirect = acceptHeader.includes("text/html");

  return handlePaymentCallback(req, payload, isBrowserRedirect);
}

async function handlePaymentCallback(req: NextRequest, payload: Record<string, any>, isBrowserRedirect: boolean) {
  const start = performance.now();
  const latencyMs = Math.round(performance.now() - start);
  const merchantId = req.headers.get("x-merchant-id") || payload.mid || "9000012429";
  const validation = validateCardlinkPayload(payload, "payment");
  const isSuccess = validation.valid;
  const statusCode = isSuccess ? 200 : 400;

  await logWebhookEvent(
    "payment",
    payload,
    merchantId,
    isSuccess ? "success" : "failure",
    validation.errors.length > 0 ? validation.errors.join("; ") : undefined,
    {
      statusCode,
      latencyMs,
      validation,
      endpoint: "/api/webhooks/cardlink/payment",
    }
  );

  // If customer browser returning from Cardlink 3DS redirection, redirect them to dashboard/receipt
  if (isBrowserRedirect) {
    const statusParam = isSuccess ? "success" : "declined";
    const orderId = payload.orderid || payload.orderId || "";
    return NextResponse.redirect(
      new URL(`/?orderId=${encodeURIComponent(orderId)}&paymentStatus=${statusParam}`, req.url)
    );
  }

  return NextResponse.json(
    {
      received: true,
      validated: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      digestVerified: validation.digestVerified,
    },
    { status: statusCode }
  );
}
