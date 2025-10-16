import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { takeTemp, putTemp } from "@/lib/authState";
import { saveSessionToFile } from "@/lib/sessionStore";

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
    const { code } = await req.json();
    const codeDigits = String(code || "").replace(/\D/g, "");
    if (codeDigits.length !== 5) {
      return NextResponse.json({ ok:false, error:"OTP_REQUIRED" }, { status:400 });
    }

    const c = await cookies();
    const authId = c.get("tg_auth_id")?.value || "";
    if (!authId) return NextResponse.json({ ok:false, error:"FLOW_EXPIRED" }, { status:400 });

    const temp = takeTemp(authId);
    if (!temp?.session || !temp?.phone || !temp?.hash) {
      return NextResponse.json({ ok:false, error:"FLOW_EXPIRED" }, { status:400 });
    }

    const client = makeClient(temp.session);  // <-- reuse SAME temp session
    await client.connect();

    try {
      await client.invoke(new Api.auth.SignIn({
        phoneNumber: temp.phone,
        phoneCodeHash: temp.hash,
        phoneCode: codeDigits,
      }));

      const me = await client.getMe();
      const userId = me?.id?.toString?.() || "unknown";
      const finalSession = client.session.save();
      saveSessionToFile(userId, finalSession);

      const r = NextResponse.json({ ok:true, needsPassword:false, user:{ id:userId } });
      r.cookies.delete("tg_auth_id");
      return r;
    } catch (err) {
      const msg = String(err?.message || err?.errorMessage || "");
      if (msg.includes("SESSION_PASSWORD_NEEDED")) {
        // keep the temp session for the /otp step
        putTemp(authId, temp);
        return NextResponse.json({ ok:true, needsPassword:true, authId });
      }
      return NextResponse.json({ ok:false, error: msg || "SIGN_IN_FAILED" }, { status:400 });
    }
  } catch (e) {
    return NextResponse.json({ ok:false, error: e?.message || "SIGN_IN_FAILED" }, { status:500 });
  }
}
