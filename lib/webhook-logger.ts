import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export function sanitizeFirestoreData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        sanitized[key] = sanitizeFirestoreData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

export async function logWebhookEvent(
  event: string,
  payload: any,
  merchantId: string,
  status: "success" | "failure",
  error?: string
) {
  try {
    const rawData: Record<string, any> = {
      timestamp: new Date().toISOString(),
      status: status || "success",
      event: event || "unknown",
      payload: payload ?? null,
      merchantId: merchantId || "unknown",
    };

    if (error !== undefined && error !== null) {
      rawData.error = String(error);
    }

    const sanitizedData = sanitizeFirestoreData(rawData);
    await addDoc(collection(db, "webhook_logs"), sanitizedData);
  } catch (e) {
    console.error("Failed to log webhook event:", e);
  }
}

