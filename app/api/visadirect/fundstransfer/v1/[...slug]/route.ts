import { NextRequest, NextResponse } from "next/server";
import { logWebhookEvent } from "@/lib/webhook-logger";

/**
 * Visa Direct Funds Transfer API:
 * - /visadirect/fundstransfer/v1/pushfundstransactions
 * - /visadirect/fundstransfer/v1/pullfundstransactions
 * - /visadirect/fundstransfer/v1/multipushfundstransactions
 * - /visadirect/fundstransfer/v1/multipullfundstransactions
 * - /visadirect/fundstransfer/v1/reversefundstransactions
 */
export async function POST(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    const transactionIdentifier = Math.floor(100000000000 + Math.random() * 900000000000);
    const approvalCode = `V${Math.floor(100000 + Math.random() * 900000)}`;

    if (pathname.endsWith("/pushfundstransactions")) {
      const {
        amount,
        transactionCurrencyCode,
        recipientPrimaryAccountNumber = "",
        recipientName = "Beneficiary",
        senderAccountNumber = "4111••••1111",
        systemsTraceAuditNumber,
        retrievalReferenceNumber,
      } = body;

      const pushResponse = {
        transactionIdentifier,
        actionCode: "00", // Approved
        approvalCode,
        responseCode: "0",
        transmissionDateTime: timestamp,
      };

      await logWebhookEvent(
        "visa_direct_push_funds",
        {
          transactionIdentifier,
          amount,
          currency: transactionCurrencyCode,
          recipient: recipientName,
          maskedPan: recipientPrimaryAccountNumber.slice(-4),
          systemsTraceAuditNumber,
          retrievalReferenceNumber,
          status: "SUCCESS",
        },
        "9000012429",
        "success"
      );

      return NextResponse.json(pushResponse, { status: 200 });
    }

    if (pathname.endsWith("/pullfundstransactions")) {
      const pullResponse = {
        transactionIdentifier,
        actionCode: "00",
        approvalCode,
        responseCode: "0",
        transmissionDateTime: timestamp,
      };
      return NextResponse.json(pullResponse, { status: 200 });
    }

    if (pathname.endsWith("/multipushfundstransactions")) {
      const requests = body.request || [body];
      const responses = requests.map((_: any, idx: number) => ({
        transactionIdentifier: transactionIdentifier + idx,
        actionCode: "00",
        approvalCode: `V${Math.floor(100000 + Math.random() * 900000)}`,
        responseCode: "0",
        transmissionDateTime: timestamp,
      }));
      return NextResponse.json({ response: responses }, { status: 200 });
    }

    if (pathname.endsWith("/multipullfundstransactions")) {
      const requests = body.request || [body];
      const responses = requests.map((_: any, idx: number) => ({
        transactionIdentifier: transactionIdentifier + idx,
        actionCode: "00",
        approvalCode: `V${Math.floor(100000 + Math.random() * 900000)}`,
        responseCode: "0",
        transmissionDateTime: timestamp,
      }));
      return NextResponse.json({ response: responses }, { status: 200 });
    }

    if (pathname.endsWith("/reversefundstransactions")) {
      const reverseResponse = {
        transactionIdentifier: body.transactionIdentifier || transactionIdentifier,
        actionCode: "00",
        approvalCode: `R${Math.floor(100000 + Math.random() * 900000)}`,
        responseCode: "0",
        transmissionDateTime: timestamp,
      };
      return NextResponse.json(reverseResponse, { status: 200 });
    }

    return NextResponse.json({ error: "Unsupported Visa Direct endpoint" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
