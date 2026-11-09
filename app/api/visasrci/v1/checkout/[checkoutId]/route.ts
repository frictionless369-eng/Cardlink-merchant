import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ checkoutId: string }> }
) {
  try {
    const { checkoutId } = await params;
    const session = global._ctpSessions?.get(checkoutId);

    if (!session) {
      return NextResponse.json(
        { errorCode: "NOT_FOUND", message: `Checkout session '${checkoutId}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        checkoutId: session.checkoutId,
        status: session.status,
        transactionId: session.transactionId,
        paymentToken: session.paymentToken,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { errorCode: "SERVER_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
