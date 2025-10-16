// // src/lib/authState.js
// // Minimal in-memory store for the temp GramJS session between OTP and 2FA
// const mem = new Map(); // authId -> { session, ts }

// export function putTemp(authId, session) {
//   mem.set(authId, { session, ts: Date.now() });
// }

// export function takeTemp(authId) {
//   const v = mem.get(authId);
//   mem.delete(authId);
//   return v?.session || "";
// }

// In-memory store: authId -> { session, phone, hash, ts }
// const mem = new Map();

// export function putTemp(authId, data) { mem.set(authId, { ...data, ts: Date.now() }); }
// export function takeTemp(authId) { const v = mem.get(authId); mem.delete(authId); return v || null; }
// In-memory store that survives hot reloads in dev
const mem = globalThis.__tgAuthMem || new Map();
if (!globalThis.__tgAuthMem) globalThis.__tgAuthMem = mem;

export function putTemp(authId, data) { mem.set(authId, { ...data, ts: Date.now() }); }
export function takeTemp(authId) { const v = mem.get(authId); mem.delete(authId); return v || null; }

