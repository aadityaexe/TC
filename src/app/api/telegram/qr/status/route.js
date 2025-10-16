export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
const store = global._tgQrStore ?? (global._tgQrStore = new Map());

export async function POST(req) {
  const { key } = await req.json();
  if (!key) return NextResponse.json({ authorized: false, invalid: true, routeVersion: "status-v3" });

  const entry = store.get(key);
  if (!entry) return NextResponse.json({ authorized: false, invalid: true, routeVersion: "status-v3" });

  if (entry.error) return NextResponse.json({ authorized: false, error: entry.error, routeVersion: "status-v3" });

  if (entry.authorized && entry.session) {
    return NextResponse.json({
      authorized: true,
      session: entry.session,
      filePath: entry.sessionFile || null,
      routeVersion: "status-v3",
    });
  }

  if (Date.now() >= (entry.expiresAt || 0)) return NextResponse.json({ authorized: false, expired: true, routeVersion: "status-v3" });
  if (entry.accepted) return NextResponse.json({ authorized: false, accepted: true, routeVersion: "status-v3" });

  return NextResponse.json({ authorized: false, routeVersion: "status-v3" });
}
