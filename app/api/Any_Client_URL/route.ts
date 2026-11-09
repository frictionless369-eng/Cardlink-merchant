import { NextRequest, NextResponse } from "next/server";
import { logWebhookEvent } from "@/lib/webhook-logger";

/**
 * Visa Business Data Solutions Push Authorization Data API: /Any_Client_URL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Log the incoming commercial authorization event
    await logWebhookEvent(
      "visa_push_auth_data",
      body,
      body.crdAcptrId || "9000012429",
      "success",
      undefined,
      {
        statusCode: 200,
        latencyMs: 40,
        endpoint: "/Any_Client_URL",
      }
    );

    return NextResponse.json(
      {
        status: "SUCCESS",
        message: "Commercial authorization data received and indexed into transaction stream.",
        tranId: body.tranId || `TRAN_${Date.now()}`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
