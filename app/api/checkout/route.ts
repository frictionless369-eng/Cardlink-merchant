import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Simulate payment processing with ABA PayWay
  console.log("Processing ABA PayWay payment:", body);

  return NextResponse.json({
    success: true,
    message: "Payment processed successfully via ABA PayWay simulation.",
    transactionId: "pw_" + Math.random().toString(36).substring(7),
  });
}
