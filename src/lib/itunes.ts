import "server-only";
import { ARTWORK_PX, PLAYLIST, type Track } from "./playlist";

/**
 * Fetches the playlist's songs from Apple's public iTunes lookup API — on the
 * server only, once a day (the result is cached and the page regenerated
 * from it), so visitors never call Apple for the list and the API's rate
 * limit is never near.
 *
 * Nothing here is secret: the API takes no key and no account. The ids are
 * fixed in `lib/playlist`, so no visitor input ever reaches the request. What
 * comes back is treated as untrusted: a song is kept only if it has every
 * field the player needs, and each URL is HTTPS on the one Apple host that
 * kind of link should come from — anything else is dropped rather than
 * handed to the page. If Apple can't be reached, the player just has no
 * songs.
 */

const LOOKUP = "https://itunes.apple.com/lookup";
/** the storefront the ids are looked up in */
const COUNTRY = "US";
/** how long the fetched playlist is kept before it's asked for again, in s */
const REFRESH_S = 86400;
/** give up on Apple after this long, in ms */
const TIMEOUT_MS = 8000;

const isPreviewHost = (host: string) => host === "audio-ssl.itunes.apple.com";
const isArtworkHost = (host: string) => /^is\d+-ssl\.mzstatic\.com$/.test(host);
const isPageHost = (host: string) => host === "music.apple.com";

/** `value` as a URL string, if it's HTTPS on a host `allowed` accepts */
function safeUrl(value: unknown, allowed: (host: string) => boolean): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowed(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

/** one lookup result as a `Track`, or null if it's missing anything */
function toTrack(raw: unknown): Track | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.kind !== "song" || typeof r.trackId !== "number") return null;
  if (typeof r.trackName !== "string" || typeof r.artistName !== "string") return null;
  const previewUrl = safeUrl(r.previewUrl, isPreviewHost);
  // the cover comes back at 100px; the size is part of its path
  const artworkUrl = safeUrl(
    typeof r.artworkUrl100 === "string"
      ? r.artworkUrl100.replace("/100x100bb.", `/${ARTWORK_PX}x${ARTWORK_PX}bb.`)
      : null,
    isArtworkHost,
  );
  const pageUrl = safeUrl(r.trackViewUrl, isPageHost);
  if (!previewUrl || !artworkUrl || !pageUrl) return null;
  return {
    id: r.trackId,
    title: r.trackName,
    artist: r.artistName,
    previewUrl,
    artworkUrl,
    pageUrl,
  };
}

/** the playlist's songs, in its order — any Apple couldn't supply left out */
export async function getPlaylist(): Promise<Track[]> {
  if (PLAYLIST.length === 0) return [];
  const query = new URLSearchParams({ id: PLAYLIST.join(","), country: COUNTRY });
  try {
    const res = await fetch(`${LOOKUP}?${query}`, {
      next: { revalidate: REFRESH_S },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    const results =
      typeof data === "object" && data !== null && Array.isArray((data as { results?: unknown }).results)
        ? (data as { results: unknown[] }).results
        : [];
    const byId = new Map<number, Track>();
    for (const raw of results) {
      const track = toTrack(raw);
      if (track) byId.set(track.id, track);
    }
    return PLAYLIST.flatMap((id) => byId.get(id) ?? []);
  } catch (err) {
    console.warn("[playlist] couldn't load songs from iTunes:", err);
    return [];
  }
}
