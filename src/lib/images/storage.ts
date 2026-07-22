import path from "node:path";
import { promises as fs } from "node:fs";

/**
 * Directory where uploaded/generated media lives. Mounted as a Docker
 * volume in production so files persist across container rebuilds.
 * Served via /api/media/[filename] rather than /public because Next
 * bakes /public at build time.
 */
export const MEDIA_DIR =
  process.env.MEDIA_DIR || path.join(process.cwd(), "uploads");

export async function ensureMediaDir(): Promise<void> {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
}

export function mediaUrl(filename: string): string {
  return `/api/media/${filename}`;
}

/**
 * Return an absolute URL for a media path. External platforms (LinkedIn,
 * Facebook, Wasla) fetch media by URL from the public internet, so any
 * relative path returned to the browser must be resolved against the
 * app's public origin before being handed to a publisher.
 */
export function absoluteMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.NEXTAUTH_URL || process.env.APP_URL || "").replace(
    /\/$/,
    ""
  );
  if (!base) return url;
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

/** Filenames we write ourselves — sanitize any external input separately. */
export function isSafeFilename(name: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(name) && !name.includes("..");
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function mimeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

export function extForMime(mime: string): string | null {
  const entry = Object.entries(MIME_BY_EXT).find(([, m]) => m === mime);
  return entry ? entry[0] : null;
}
