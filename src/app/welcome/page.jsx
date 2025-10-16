// src/app/welcome/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/telegram/me', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
          // No session or error → go back to start
          router.replace('/');
          return;
        }

        if (!cancelled) {
          setFirstName(String(data?.user?.firstName || '').trim());
          setLoading(false);
        }
      } catch {
        router.replace('/');
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

  const name = firstName || 'there';

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      {/* fixed-width container like Telegram */}
      <div className="w-[360px] sm:w-[380px] flex flex-col items-center text-center">

        {/* Mascot / logo (kept same feel as your other pages) */}
        <div
          className="w-[140px] h-[140px] bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: 'url(/monkey-open.png)' }}
          aria-label="Mascot"
        />

        {/* Title */}
        <h1 className="mt-4 text-[32px] font-semibold leading-tight">
          {loading ? 'Welcome…' : `Welcome, ${name}!`}
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-[15px] leading-[22px] text-gray-600">
          {loading ? 'Checking your session…' : 'You have successfully logged in.'}
        </p>

        {/* Optional: a small action row */}
        {!loading && (
          <div className="mt-6 flex items-center gap-3">
            <a
              href="/"
              className="text-[15px] text-blue-600 hover:text-blue-700 underline transition"
            >
              Go to home
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
