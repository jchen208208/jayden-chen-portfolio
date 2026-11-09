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
  1716760722, // Jordana & TV Girl — Better in the Dark
  1623923868, // TV Girl — Blue Hair
  1623929724, // TV Girl — Louise
  1097862845, // Radiohead — Fake Plastic Trees
  6814986953, // Panchiko — D>E>A>T>H>M>E>T>A>L
  6789828849, // Mac DeMarco — No Other Heart
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
