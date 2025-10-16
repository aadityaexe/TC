export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const store = global._tgQrStore ?? (global._tgQrStore = new Map());

const SESSIONS_DIR = path.join(process.cwd(), "sessions");
async function saveSessionFile(filename, sessionString) {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
  const filePath = path.join(SESSIONS_DIR, filename);
  await fs.writeFile(filePath, sessionString, "utf8");
  return filePath;
}

async function getDcEndpoint(client, dcId) {
  const cfg = await client.invoke(new Api.help.GetConfig());
  const opt = cfg.dcOptions.find((d) => d.id === dcId && !d.cdn);
  if (!opt) throw new Error(`No dcOption for dcId=${dcId}`);
  return { id: opt.id, ip: opt.ipAddress, port: opt.port };
}

export async function GET() {
  try {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.connect();

    const first = await client.invoke(
      new Api.auth.ExportLoginToken({ apiId, apiHash, exceptIds: [] })
    );

    if (first.className === "auth.loginTokenSuccess") {
      const session = client.session.save();
      const fn = `tg-fast-${Date.now()}.session`;
      const fp = await saveSessionFile(fn, session);
      await client.disconnect();
      console.log("[QR][route] ✅ fast-path session saved:", fp);
      return NextResponse.json({ authorized: true, session, filePath: fp, routeVersion: "qr-route-v3" });
    }

    const token = first.token;
    const qrUrl = "tg://login?token=" + Buffer.from(token).toString("base64url");
    const key = crypto.randomUUID();
    const expiresAt = Date.now() + 28_000; // conservative

    const entry = {
      client,
      token,
      accepted: false,
      authorized: false,
      session: null,
      sessionFile: null,
      expiresAt,
      finishing: false,
      error: null,
    };
    store.set(key, entry);

    client.addEventHandler(async (update) => {
      if (update?.className !== "UpdateLoginToken") return;
      console.log("[QR][route] UpdateLoginToken received → accepted");
      entry.accepted = true;

      if (entry.finishing || entry.authorized) return;
      entry.finishing = true;

      try {
        // Export #2 – immediately after accept, while token is fresh
        let next = await client.invoke(
          new Api.auth.ExportLoginToken({ apiId, apiHash, exceptIds: [] })
        );

        if (next.className === "auth.loginTokenMigrateTo") {
          console.log("[QR][route] migrateTo DC", next.dcId, "→ resolving endpoint and importing there…");
          // Resolve endpoint of target DC
          const ep = await getDcEndpoint(client, next.dcId);

          // Pin a temp session to that DC
          const temp = new StringSession("");
          // @ts-ignore setDC exists
          temp.setDC(ep.id, ep.ip, ep.port);
          const tempClient = new TelegramClient(temp, apiId, apiHash, { connectionRetries: 2 });
          await tempClient.connect();

          const after = await tempClient.invoke(new Api.auth.ImportLoginToken({ token: next.token }));
          console.log("[QR][route] import result on DC", next.dcId, "→", after.className);

          if (after.className === "auth.loginTokenSuccess") {
            const session = tempClient.session.save();

            // Optional: name file by username/id
            let tag = null;
            try { const me = await tempClient.getMe(); tag = me?.username || (me?.id ? String(me.id) : null); } catch {}
            const base = tag ? `tg-${tag}` : `tg-${key}`;
            const fp = await saveSessionFile(`${base}.session`, session);

            entry.session = session;
            entry.sessionFile = fp;
            entry.authorized = true;
            console.log("[QR][route] ✅ session saved:", fp);
          }

          try { await tempClient.disconnect(); } catch {}
          try { await client.disconnect(); } catch {}
          entry.finishing = false;
          return;
        }

        if (next.className === "auth.loginTokenSuccess") {
          const session = client.session.save();
          let tag = null;
          try { const me = await client.getMe(); tag = me?.username || (me?.id ? String(me.id) : null); } catch {}
          const base = tag ? `tg-${tag}` : `tg-${key}`;
          const fp = await saveSessionFile(`${base}.session`, session);

          entry.session = session;
          entry.sessionFile = fp;
          entry.authorized = true;
          console.log("[QR][route] ✅ session saved (same DC):", fp);

          try { await client.disconnect(); } catch {}
          entry.finishing = false;
          return;
        }

        console.log("[QR][route] export-after-accept returned:", next.className);
        entry.finishing = false;
      } catch (e) {
        console.error("[QR][route] accept-flow error:", e?.message || e);
        entry.error = String(e?.errorMessage || e?.message || e);
        entry.finishing = false;
      }
    });

    return NextResponse.json({ key, qrUrl, expiresAt, routeVersion: "qr-route-v3" });
  } catch (err) {
    console.error("[QR][route] error:", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
