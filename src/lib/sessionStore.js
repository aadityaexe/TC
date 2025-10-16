import fs from "fs";
import path from "path";

const base = path.join(process.cwd(), "sessions");
function ensureDir() {
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
}
function fileOf(userId) { return path.join(base, `${userId}.session`); }

export function saveSessionToFile(userId, stringSession) {
  ensureDir();
  fs.writeFileSync(fileOf(userId), stringSession, "utf8");
  return fileOf(userId);
}

export function loadSessionFromFile(userId) {
  try {
    const p = fileOf(userId);
    if (!fs.existsSync(p)) return "";
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

export function deleteSessionFile(userId) {
  try { fs.unlinkSync(fileOf(userId)); } catch {}
}
