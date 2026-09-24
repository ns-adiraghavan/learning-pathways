/**
 * Video source helpers — a video activity can be a direct upload, a YouTube
 * link or a Google Drive link. These helpers normalise the source so the
 * player knows how to render it, and give the trainer UI a way to validate a
 * pasted link. Frontend only — no upload/transcode is performed yet.
 */

import type { VideoProvider } from "@/data/types";

export type { VideoProvider };

/** Infer the provider from an explicit flag or, failing that, from the URL. */
export function resolveProvider(src: string, provider?: VideoProvider): VideoProvider {
  if (provider) return provider;
  return detectProvider(src);
}

export function detectProvider(src: string): VideoProvider {
  const s = (src ?? "").trim();
  if (/youtube\.com|youtu\.be/i.test(s)) return "youtube";
  if (/drive\.google\.com/i.test(s)) return "gdrive";
  return "upload";
}

/** Pull the 11-char video id out of any common YouTube URL shape. */
export function youtubeId(url: string): string | null {
  const s = (url ?? "").trim();
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*\bv=)([\w-]{11})/i,
    /(?:youtu\.be\/)([\w-]{11})/i,
    /(?:youtube\.com\/embed\/)([\w-]{11})/i,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** Pull the file id out of a Google Drive share/preview URL. */
export function gdriveId(url: string): string | null {
  const s = (url ?? "").trim();
  const byPath = s.match(/\/file\/d\/([\w-]+)/);
  if (byPath?.[1]) return byPath[1];
  const byQuery = s.match(/[?&]id=([\w-]+)/);
  if (byQuery?.[1]) return byQuery[1];
  return null;
}

/** A YouTube embed URL with the scrubber and keyboard seeking suppressed. */
export function youtubeEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    controls: "0", // hide the timeline scrubber so learners can't drag ahead
    disablekb: "1", // block keyboard seeking (arrow keys, etc.)
    playsinline: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function gdrivePreviewUrl(id: string): string {
  return `https://drive.google.com/file/d/${id}/preview`;
}

/** True when a pasted link is a shape we can actually embed. */
export function isValidVideoLink(provider: VideoProvider, url: string): boolean {
  if (provider === "youtube") return youtubeId(url) != null;
  if (provider === "gdrive") return gdriveId(url) != null;
  return Boolean(url);
}

/** mm:ss → seconds. Returns null on anything unparseable. */
export function parseClock(value: string): number | null {
  const s = (value ?? "").trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  const m = s.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** seconds → mm:ss, for prefilling the checkpoint input. */
export function toClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
