/**
 * Whether the role page showing now (`/experience/{slug}`) was reached by
 * clicking through from the Experience list in this tab. If it was, leaving
 * the page can simply go back — to the desk with the Experience view still
 * open, or to the stacked `/experience` page — rather than pushing a fresh
 * `/experience` on top. A reload or a deep link starts it false.
 *
 * The role pages' previous / next links replace the history entry rather
 * than adding one, so "back" from any of them still lands on the list.
 */
let fromList = false;

/** the list's cards call this as they're clicked */
export function markFromList() {
  fromList = true;
}

/** read once, when the role page is left */
export function takeFromList() {
  const was = fromList;
  fromList = false;
  return was;
}
