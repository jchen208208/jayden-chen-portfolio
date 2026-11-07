/**
 * The desk speaker's songs (`SpeakerPopup`), in play order, as iTunes track
 * ids — pinned rather than searched for at runtime, so a song can't drift to
 * a live take or a remix. To add one, look it up at
 * https://itunes.apple.com/search?term=artist+song&entity=song and copy its
 * `trackId`.
 *
 * They play as Apple's 30-second previews, streamed from Apple; `lib/itunes`
 * fetches each one's details. No account or API key is involved.
 */
export const PLAYLIST: readonly number[] = [
  617154366, // Daft Punk — Get Lucky (stand-in)
  594061856, // Fleetwood Mac — Dreams (stand-in)
  1499378607, // The Weeknd — Blinding Lights (stand-in)
];

/** the side, in px, of the album covers asked of Apple */
export const ARTWORK_PX = 300;

/** one playable song, as the popup gets it — every URL already checked */
export type Track = {
  id: number;
  title: string;
  artist: string;
  /** Apple's 30-second preview */
  previewUrl: string;
  artworkUrl: string;
  /** the song on Apple Music — its title links here */
  pageUrl: string;
};
