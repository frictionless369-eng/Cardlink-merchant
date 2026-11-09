import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Automated Cardlink Transaction Test Suite API Route
 *
 * Runs end-to-end integration tests for Cardlink VPOS transaction flows,
 * testing payment initiation, digest generation, and all 6 advice/callback webhooks.
 */
export async function GET(req: NextRequest) {
  return runTestSuite(req);
}

export async function POST(req: NextRequest) {
  return runTestSuite(req);
}

async function runTestSuite(req: NextRequest) {
  const origin = req.nextUrl.origin || "https://cardlink-merchant.vercel.app";
  const mid = "9000012429";
  const secret = process.env.CARDLINK_SECRET || "Cardlink1";
  const timestamp = Date.now();
  const testOrderId = `test_tx_${timestamp}`;

  const results: Array<{
    name: string;
    endpoint: string;
    passed: boolean;
    statusCode: number;
    latencyMs: number;
    details?: any;
    error?: string;
  }> = [];

  // Helper for internal HTTP requests
  const executeTest = async (
    name: string,
    endpoint: string,
    method: "GET" | "POST",
    body?: any
  ) => {
    const start = performance.now();
    try {
      const url = `${origin}${endpoint}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-merchant-id": mid,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const latencyMs = Math.round(performance.now() - start);
      const json = await res.json().catch(() => ({}));
      results.push({
        name,
        endpoint,
        passed: res.ok,
        statusCode: res.status,
        latencyMs,
        details: json,
      });
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      results.push({
        name,
        endpoint,
        passed: false,
        statusCode: 500,
        latencyMs,
        error: err.message,
      });
    }
  };

  // Test 1: Cardlink Payment Initiation (MPI Redirection & Digest Calculation)
  await executeTest(
    "1. Cardlink Payment Initiation (/api/cardlink)",
    "/api/cardlink",
    "POST",
    {
      orderId: testOrderId,
      amount: "150.00",
      currency: "EUR",
      email: "resort.guest@luxurystay.gr",
      roomName: "Royal Ocean Villa",
    }
  );

  // Digest calculation for webhooks
  const orderAmount = "150.00";
  const currency = "EUR";
  const status = "CAPTURED";
  const txId = `cardlink_tx_${timestamp}`;
  const rawSig = `${mid}${testOrderId}${orderAmount}${currency}${status}${txId}${secret}`;
  const validDigest = crypto.createHash("sha256").update(rawSig, "utf8").digest("base64");

  // Test 2: Webhook - Payment Advice Callback
  await executeTest(
    "2. Webhook - Payment Advice (/api/webhooks/cardlink/payment-advice)",
    "/api/webhooks/cardlink/payment-advice",
    "POST",
    {
      mid,
      orderid: testOrderId,
      orderAmount,
      currency,
      status,
      txId,
      paymentRef: `ref_${timestamp}`,
      digest: validDigest,
      payerEmail: "resort.guest@luxurystay.gr",
    }
  );

  // Test 3: Webhook - Capture Advice Callback
  await executeTest(
    "3. Webhook - Capture Advice (/api/webhooks/cardlink/capture-advice)",
    "/api/webhooks/cardlink/capture-advice",
    "POST",
    {
      mid,
      orderid: testOrderId,
      orderAmount,
      currency,
      status: "SETTLED",
      txId,
      settlementId: `stl_${timestamp}`,
      digest: validDigest,
    }
  );

  // Test 4: Webhook - Cancel Advice Callback
  await executeTest(
    "4. Webhook - Cancel Advice (/api/webhooks/cardlink/cancel-advice)",
    "/api/webhooks/cardlink/cancel-advice",
    "POST",
    {
      mid,
      orderid: testOrderId,
      orderAmount,
      currency,
      status: "VOIDED",
      txId,
      cancelReason: "Customer booking cancellation request",
      digest: validDigest,
    }
  );

  // Test 5: Standard Webhook - Payment
  await executeTest(
    "5. Webhook - Standard Payment (/api/webhooks/cardlink/payment)",
    "/api/webhooks/cardlink/payment",
    "POST",
    {
      mid,
      orderid: testOrderId,
      orderAmount,
      currency,
      status: "CAPTURED",
      digest: validDigest,
    }
  );

  // Test 6: Standard Webhook - Capture
  await executeTest(
    "6. Webhook - Standard Capture (/api/webhooks/cardlink/capture)",
    "/api/webhooks/cardlink/capture",
    "POST",
    {
      mid,
      orderid: testOrderId,
      orderAmount,
      currency,
      status: "SETTLED",
    }
  );

  // Test 7: Standard Webhook - Cancel
  await executeTest(
    "7. Webhook - Standard Cancel (/api/webhooks/cardlink/cancel)",
    "/api/webhooks/cardlink/cancel",
    "POST",
    {
      mid,
      orderid: testOrderId,
      orderAmount,
      currency,
      status: "CANCELLED",
    }
  );

  // Test 8: Cardlink Check Capabilities API
  await executeTest(
    "8. Cardlink Capability Check (/api/cardlink/check-capabilities)",
    "/api/cardlink/check-capabilities",
    "POST",
    {
      recipientType: "bank",
      recipientData: { accountNumber: "GR16026000000001234567890" },
      amount: "150.00",
      currency: "EUR",
    }
  );

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const allPassed = passedTests === totalTests;

  return NextResponse.json({
    success: allPassed,
    timestamp: new Date().toISOString(),
    merchantId: mid,
    testOrderId,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      passRate: `${Math.round((passedTests / totalTests) * 100)}%`,
    },
    results,
  });
}
