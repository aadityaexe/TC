// app/page-transition.jsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [routeKey, setRouteKey] = useState(pathname);

  useEffect(() => {
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    setRouteKey(pathname + qs);
  }, [pathname]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={routeKey}                // <- re-mount on path or query change
          className="absolute inset-0 will-change-transform transform-gpu"
          initial={{ x: '110%', opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] } }}
          exit={{ x: '-40%', opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
