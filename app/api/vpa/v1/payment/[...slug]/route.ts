import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { sanitizeFirestoreData, logWebhookEvent } from "@/lib/webhook-logger";

/**
 * Visa Payables Automation (VPA) / B2B Virtual Account Payment Service
 * Paths:
 * - /vpa/v1/payment/ProcessPayments
 * - /vpa/v1/payment/GetPaymentDetailURL
 * - /vpa/v1/payment/GetPaymentDetails
 * - /vpa/v1/payment/CancelPayment
 * - /vpa/v1/payment/ResendPayment
 */

export async function POST(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Method 1: ProcessPayments
    if (pathname.endsWith("/ProcessPayments")) {
      const { buyerId, clientId, messageId, payment, actionType } = body;

      if (!buyerId || !clientId || !messageId || !payment) {
        return NextResponse.json(
          { PP001: { description: "Missing required fields: buyerId, clientId, messageId, or payment" } },
          { status: 400 }
        );
      }

      const grossAmount = parseFloat(payment.paymentGrossAmount || "0");
      const currency = payment.currencyCode || "USD";
      const supplierName = payment.supplier?.supplierName || "Resort Vendor Supplier";
      const maskedAcct = payment.accountNumber ? `••••${payment.accountNumber.slice(-4)}` : "4111••••1111";

      const processResponse = {
        ProcessResponse: {
          messageId,
          statusCode: "PP001",
          statusDesc: "Successfully processed B2B virtual account payment.",
          accountNumber: maskedAcct,
          expirationDate: payment.paymentExpiryDate || "12/2028",
        },
      };

      // Record in transactions ledger
      await addDoc(
        collection(db, "transactions"),
        sanitizeFirestoreData({
          id: `vpa_${Date.now()}`,
          date: new Date().toISOString(),
          amount: grossAmount,
          currency,
          status: "Completed",
          type: "payout",
          entryMethod: "VPA_B2B_VIRTUAL_ACCOUNT",
          gateway: "VISA_B2B_VPA",
          recipientName: supplierName,
          maskedPan: maskedAcct.slice(-4),
          merchantId: clientId || "9000012429",
        })
      );

      await logWebhookEvent("vpa_process_payment", processResponse, clientId || "9000012429", "success");
      return NextResponse.json(processResponse, { status: 201 });
    }

    // Method 2: GetPaymentDetailURL
    if (pathname.endsWith("/GetPaymentDetailURL")) {
      const { buyerId, clientId, messageId, originalMessageId, accountNumber } = body;
      const urlResponse = {
        GetPaymentURLResponse: {
          url: `https://vpa.visa.com/b2b/portal/verify?buyer=${buyerId}&msg=${originalMessageId}`,
          messageId,
          statusCode: "GURL001",
          statusDesc: "URL received successfully.",
        },
      };
      return NextResponse.json(urlResponse, { status: 201 });
    }

    // Method 3: GetPaymentDetails
    if (pathname.endsWith("/GetPaymentDetails")) {
      const { buyerId, clientId, messageId, resultSetNo = "1" } = body;
      const detailsResponse = {
        GetPaymentResponse: {
          messageId,
          statusCode: "GPD539",
          statusDesc: "Get Payment Details completed successfully.",
          resultSetNo,
          hasMoreElements: "N",
          totalRecordCount: "1",
          payments: {
            accountNumber: "4111••••1111",
            currencyCode: "USD",
            paymentGrossAmount: "250.00",
            paymentExpiryDate: "2028-12-31",
            paymentRequestDate: new Date().toISOString().slice(0, 10),
            systemMatchStatus: "Matched",
            supplier: {
              supplierID: "SUPP_10281",
              supplierName: "Aegean Luxury Hospitality Ltd",
              primaryEmailAddress: "vendor@resort-hospitality.com",
            },
          },
        },
      };
      return NextResponse.json(detailsResponse, { status: 201 });
    }

    // Method 4: CancelPayment
    if (pathname.endsWith("/CancelPayment")) {
      const { buyerId, clientId, messageId, originalMessageId, cancelReason } = body;
      const cancelResponse = {
        CancelResponse: {
          messageID: messageId,
          statusCode: "CP001",
          statusDesc: "Payment canceled successfully.",
          supplierID: "SUPP_10281",
          supplierName: "Aegean Luxury Hospitality Ltd",
          grossAmount: "250.00",
        },
      };
      return NextResponse.json(cancelResponse, { status: 201 });
    }

    // Method 5: ResendPayment
    if (pathname.endsWith("/ResendPayment")) {
      const { buyerId, clientId, messageId, originalMessageId, primaryEmailAddress } = body;
      const resendResponse = {
        ResendResponse: {
          messageId,
          statusCode: "RSP001",
          statusDesc: "Resend Payment initiated successfully.",
        },
      };
      return NextResponse.json(resendResponse, { status: 201 });
    }

    return NextResponse.json({ error: "Unsupported VPA endpoint" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
