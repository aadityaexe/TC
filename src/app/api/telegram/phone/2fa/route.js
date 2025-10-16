// src/app/api/telegram/phone/2fa/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeClient, Api } from "@/lib/telegram";
import { takeTemp, putTemp } from "@/lib/authState";
import { saveSessionToFile } from "@/lib/sessionStore";

// IMPORTANT on Windows: use capital P
import * as PasswordNS from "telegram/Password";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const bodyRaw = await req.text();
    console.log("[2FA] raw body:", bodyRaw);
    let body = {};
    try { body = JSON.parse(bodyRaw || "{}"); } catch {}
    const password = String(body?.password || "");
    console.log("[2FA] password length:", password.length);

    if (!password) {
      console.log("[2FA] error: PASSWORD_REQUIRED");
      return NextResponse.json({ ok: false, error: "PASSWORD_REQUIRED" }, { status: 400 });
    }

    const c = await cookies();
    const authId = c.get("tg_auth_id")?.value || "";
    console.log("[2FA] cookie tg_auth_id:", authId || "<missing>");

    if (!authId) {
      console.log("[2FA] error: FLOW_EXPIRED (no tg_auth_id)");
      return NextResponse.json({ ok: false, error: "FLOW_EXPIRED" }, { status: 400 });
    }

    const temp = takeTemp(authId);
    console.log("[2FA] temp present?", !!temp, "keys:", temp ? Object.keys(temp) : "none");
    if (!temp?.session || !temp?.phone || !temp?.hash) {
      console.log("[2FA] error: FLOW_EXPIRED (no temp session/phone/hash)");
      return NextResponse.json({ ok: false, error: "FLOW_EXPIRED" }, { status: 400 });
    }

    const client = makeClient(temp.session);
    console.log("[2FA] created client, connecting…");
    await client.connect();
    console.log("[2FA] client connected");

    // ---- Module shape logs (to catch undefined computeCheck) ----
    const passwordNsKeys = Object.keys(PasswordNS || {});
    console.log("[2FA] PasswordNS typeof:", typeof PasswordNS);
    console.log("[2FA] PasswordNS keys:", passwordNsKeys);
    console.log("[2FA] typeof PasswordNS.computeCheck:", typeof PasswordNS?.computeCheck);

    if (typeof PasswordNS?.computeCheck !== "function") {
      // put temp back so user can retry later
      putTemp(authId, temp);
      console.log("[2FA] FATAL: computeCheck not found on PasswordNS");
      return NextResponse.json(
        { ok: false, error: "PASSWORD_HELPER_MISSING (computeCheck undefined)" },
        { status: 500 }
      );
    }

    console.log("[2FA] fetching SRP state (account.GetPassword) …");
    const pwdState = await client.invoke(new Api.account.GetPassword());
    // pwdState is a TL object; dump some safe fields if present
    console.log("[2FA] SRP state class:", pwdState?._ == null ? "<unknown>" : pwdState._);
    console.log("[2FA] SRP has currentAlgo?", !!pwdState?.currentAlgo, "has srpB?", !!pwdState?.srpB);

    console.log("[2FA] computing SRP check …");
    const passwordCheck = await PasswordNS.computeCheck(pwdState, password);
    // passwordCheck should be InputCheckPasswordSRP
    console.log("[2FA] passwordCheck class:", passwordCheck?._ || typeof passwordCheck);

    console.log("[2FA] invoking auth.CheckPassword …");
    await client.invoke(new Api.auth.CheckPassword({ password: passwordCheck }));

    const me = await client.getMe();
    const userId = me?.id?.toString?.() || "unknown";
    const finalSession = client.session.save();
    saveSessionToFile(userId, finalSession);

    const r = NextResponse.json({
      ok: true,
      user: { id: userId, firstName: me?.firstName, lastName: me?.lastName },
    });
    r.cookies.delete("tg_auth_id");
    console.log("[2FA] success; session saved for", userId);
    return r;
  } catch (err) {
    console.log("[2FA] ERROR:", err?.message, err?.stack);
    // If we failed before calling CheckPassword, we probably consumed temp already; best effort to keep retryable:
    try {
      const c2 = await cookies();
      const authId2 = c2.get("tg_auth_id")?.value || "";
      if (authId2) {
        // No-op; caller can call /send-code again if needed
      }
    } catch {}
    return NextResponse.json({ ok: false, error: err?.message || "PASSWORD_INVALID" }, { status: 400 });
  }
}
