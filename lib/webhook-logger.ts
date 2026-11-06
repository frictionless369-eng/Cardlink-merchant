import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export async function logWebhookEvent(event: string, payload: any, merchantId: string, status: "success" | "failure", error?: string) {
  try {
    await addDoc(collection(db, "webhook_logs"), {
      timestamp: new Date().toISOString(),
      status,
      event,
      payload,
      error,
      merchantId,
    });
  } catch (e) {
    console.error("Failed to log webhook event:", e);
  }
}
