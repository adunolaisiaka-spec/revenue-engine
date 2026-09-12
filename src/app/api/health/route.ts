import { NextResponse } from "next/server";
import { db } from "@/server/db";

// Unauthenticated liveness/readiness check for uptime monitoring — confirms
// the app is up AND can actually reach Postgres, not just that Next.js booted.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", reason: "database unreachable" }, { status: 503 });
  }
}
