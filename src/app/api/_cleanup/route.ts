import { NextResponse } from "next/server";

// Temporary diagnostic endpoint disabled. No side effects.
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
