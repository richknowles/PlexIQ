import { NextRequest, NextResponse } from "next/server";

const DELETION_PASSWORD = process.env.DELETION_PASSWORD || "DELETE";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ valid: false, message: "Password required" }, { status: 400 });
    }

    const isValid = password === DELETION_PASSWORD;

    return NextResponse.json({
      valid: isValid,
      message: isValid ? "Password correct" : "Incorrect deletion password"
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ valid: false, message: msg }, { status: 500 });
  }
}
