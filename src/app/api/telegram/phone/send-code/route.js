import { NextResponse } from "next/server";
import crypto from "crypto";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { putTemp } from "@/lib/authState";

export const runtime = "nodejs";

function makeClient(sessionStr="") {
  return new TelegramClient(
    new StringSession(sessionStr),
    Number(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH,
    { connectionRetries: 5 }
  );
}

export async function POST(req) {
  try {
    const { phoneNumber } = await req.json();
    if (!phoneNumber) return NextResponse.json({ ok:false, error:"PHONE_REQUIRED" }, { status:400 });

    const client = makeClient("");
    await client.connect();

    const sent = await client.invoke(new Api.auth.SendCode({
      phoneNumber,
      apiId: Number(process.env.TELEGRAM_API_ID),
      apiHash: process.env.TELEGRAM_API_HASH,
      settings: new Api.CodeSettings({}),
    }));

    // Save temp session + phone + hash under a fresh authId
    const authId = crypto.randomUUID();
    putTemp(authId, { session: client.session.save(), phone: phoneNumber, hash: sent.phoneCodeHash });

    // Set cookie with authId and return THE SAME response
    const r = NextResponse.json({ ok: true });
    const secure = process.env.NODE_ENV === "production"; // false on localhost
    r.cookies.set("tg_auth_id", authId, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 1 });
    return r;
  } catch (e) {
    return NextResponse.json({ ok:false, error: e?.message || "SEND_CODE_FAILED" }, { status:500 });
  }
}
