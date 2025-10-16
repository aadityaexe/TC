'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
// import {useRef} 
import { useRouter } from "next/navigation";



export function KeepMeSignedIn({ defaultChecked = true, onChange }) {
  const [checked, setChecked] = useState(defaultChecked);

  const toggle = () => {
    const v = !checked;
    setChecked(v);
    if (onChange) onChange(v);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="
        group flex items-center justify-start
        w-[300px] rounded-lg px-1.5 py-2
        gap-[20px]
        transition hover:bg-gray-50 hover:shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500/40
      "
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          if (onChange) onChange(e.target.checked);
        }}
        className="sr-only"
      />

      <span
        className={`
          grid h-5 w-5 place-items-center rounded
          border border-gray-300 transition
          ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white'}
          group-hover:border-gray-400
        `}
      >
        {checked && (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>

      <span className="text-[15px] text-gray-800 select-none ml-1">
        Keep me signed in
      </span>
    </button>
  );
}

// ✅ NEXT button
 

// components/AuthActions.jsx (or wherever NextButton lives)
 

 

export function NextButton({ onClick, disabled = false, loading = false }) {
  const inFlight = useRef(false);
  const isDisabled = disabled || loading;

  async function handle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!onClick || isDisabled || inFlight.current) return;
    inFlight.current = true;
    try {
      await onClick(e); // your handleNext; will call router.push(...)
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <Link
      href="#"
      onClick={handle}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      className={`inline-flex items-center justify-center
        w-[300px] mt-4 py-3 rounded-lg bg-[#3390EC]
        text-white font-semibold uppercase tracking-wide
        transition focus:outline-none focus:ring-2 focus:ring-blue-500/40
        ${isDisabled ? "opacity-60 pointer-events-none" : "hover:bg-[#2b7cd7]"}
      `}
    >
      {loading ? (
        <>
          PLEASE WAIT…
          <span
            className="ml-2 inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
            aria-hidden="true"
          />
        </>
      ) : (
        "Next"
      )}
    </Link>
  );
}


// ✅ Log in by QR code link
export function LoginByQrCode({ href = "/qr", onClick }) {
  const router = useRouter();

  function handleClick(e) {
    if (onClick) onClick(e);
    // If user code prevented default, respect it
    if (e.defaultPrevented) return;

    // Force client-side navigation so the animation runs
    e.preventDefault();
    router.push(href);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2
                 text-blue-600 uppercase tracking-wide text-[15px] font-medium
                 transition hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500/40
                 w-[360px] h-[40px]"
    >
      <b>Log in by QR code</b>
    </Link>
  );
}
