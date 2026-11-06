import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Simulate payment processing with Cardlink
  console.log("Processing Cardlink payment:", body);

  return NextResponse.json({
    success: true,
    message: "Payment processed successfully via Cardlink simulation.",
    transactionId: "clk_" + Math.random().toString(36).substring(7),
  });
}
