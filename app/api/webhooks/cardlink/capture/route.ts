import { NextRequest, NextResponse } from "next/server";
import { logWebhookEvent } from "@/lib/webhook-logger";
import { validateCardlinkPayload } from "@/lib/payload-validator";

export async function POST(req: NextRequest) {
  const start = performance.now();
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

  const latencyMs = Math.round(performance.now() - start);
  const merchantId = req.headers.get("x-merchant-id") || payload.mid || "9000012429";
  const validation = validateCardlinkPayload(payload, "capture");
  const isSuccess = validation.valid;
  const statusCode = isSuccess ? 200 : 400;

  await logWebhookEvent(
    "capture",
    payload,
    merchantId,
    isSuccess ? "success" : "failure",
    validation.errors.length > 0 ? validation.errors.join("; ") : undefined,
    {
      statusCode,
      latencyMs,
      validation,
      endpoint: "/api/webhooks/cardlink/capture",
    }
  );

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
