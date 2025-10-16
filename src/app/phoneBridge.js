// phoneBridge.js
let _data = { cc: '', phone: '' };
const subs = new Set();

export function savePhone({ cc, phone }) {
  _data = { cc: cc ?? _data.cc, phone: phone ?? _data.phone };
  subs.forEach(fn => fn());
}

export function jhola() { return _data; }                // still available if you need it
export function subscribe(cb) { subs.add(cb); return () => subs.delete(cb); }
export function getSnapshot() { return _data; }
