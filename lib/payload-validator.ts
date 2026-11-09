import crypto from "crypto";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  digestVerified: boolean | null;
  expectedDigest?: string;
  receivedDigest?: string;
  normalizedData: {
    mid?: string;
    orderid?: string;
    status?: string;
    orderAmount?: string;
    currency?: string;
    paymentRef?: string;
    cardToken?: string;
    tokenOption?: string;
    digest?: string;
  };
}

/**
 * Validates incoming Cardlink VPOS & webhook callback payloads.
 */
export function validateCardlinkPayload(
  payload: Record<string, any>,
  eventType: string = "payment",
  sharedSecret: string = process.env.CARDLINK_SECRET || "Cardlink1"
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      errors: ["Payload must be a non-empty JSON or form object"],
      warnings: [],
      digestVerified: false,
      normalizedData: {},
    };
  }

  const mid = String(payload.mid || payload.MID || payload.merchantId || "").trim();
  const orderid = String(payload.orderid || payload.orderId || payload.ORDERID || "").trim();
  const orderAmount = payload.orderAmount !== undefined ? String(payload.orderAmount) : payload.amount !== undefined ? String(payload.amount) : "";
  const currency = String(payload.currency || payload.CURRENCY || "EUR").toUpperCase().trim();
  const status = String(payload.status || payload.STATUS || payload.statusDescription || "").trim();
  const paymentRef = String(payload.paymentRef || payload.ref || payload.txId || "").trim();
  const receivedDigest = String(payload.digest || payload.DIGEST || "").trim();

  const expectedMid = process.env.CARDLINK_MERCHANT_ID || "9000012429";
  if (!mid) {
    warnings.push("Missing 'mid' (Merchant ID) in callback payload; defaulted to " + expectedMid);
  } else if (mid !== expectedMid) {
    warnings.push(`Merchant ID '${mid}' differs from configured environment MID '${expectedMid}'`);
  }

  if (!orderid) {
    errors.push("Missing required field 'orderid'");
  } else if (orderid.length > 64) {
    errors.push("Field 'orderid' exceeds maximum length of 64 characters");
  }

  if (orderAmount) {
    const num = parseFloat(orderAmount);
    if (isNaN(num) || num < 0) {
      errors.push(`Invalid 'orderAmount': '${orderAmount}'. Must be a non-negative decimal number.`);
    }
  } else if (eventType !== "cancel") {
    warnings.push("No 'orderAmount' supplied in callback payload");
  }

  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    errors.push(`Invalid currency code '${currency}'. Expected 3-letter ISO code.`);
  }

  let digestVerified: boolean | null = null;
  let expectedDigest: string | undefined;

  if (receivedDigest && sharedSecret) {
    const rawToSign = [
      payload.version || "2",
      mid || expectedMid,
      payload.lang || "en",
      orderid,
      payload.orderDesc || "",
      orderAmount,
      currency,
      payload.payerEmail || "",
      payload.confirmUrl || "",
      payload.cancelUrl || "",
      sharedSecret,
    ].join("");

    expectedDigest = crypto.createHash("sha256").update(rawToSign, "utf8").digest("base64");
    const fallbackRaw = [mid || expectedMid, orderid, status, orderAmount, sharedSecret].join("");
    const fallbackDigest = crypto.createHash("sha256").update(fallbackRaw, "utf8").digest("base64");

    if (receivedDigest === expectedDigest || receivedDigest === fallbackDigest) {
      digestVerified = true;
    } else {
      digestVerified = false;
      warnings.push("Digest mismatch. Digital signature does not match computed HMAC-SHA256 digest.");
    }
  }

  const cardToken = String(payload.cardToken || payload.cardtoken || payload.token || "").trim();
  const tokenOption = String(payload.tokenOption || payload.tokenoption || "").trim();

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    digestVerified,
    expectedDigest,
    receivedDigest: receivedDigest || undefined,
    normalizedData: {
      mid: mid || expectedMid,
      orderid,
      status: status || (errors.length === 0 ? "RECEIVED" : "INVALID"),
      orderAmount,
      currency,
      paymentRef: paymentRef || undefined,
      cardToken: cardToken || undefined,
      tokenOption: tokenOption || undefined,
      digest: receivedDigest || undefined,
    },
  };
}
