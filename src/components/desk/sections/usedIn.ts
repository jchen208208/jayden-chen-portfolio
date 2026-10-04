import { EXPERIENCE, PROJECTS } from "@/lib/site";

/** short names for the hover caption — the full ones don't fit a caption line */
const SHORT: Record<string, string> = {
  sparc: "SPARC",
  shell: "Unix Shell",
  catapult: "Catapult",
  tictactoe: "Tic-Tac-Toe",
  minesweeper: "Minesweeper",
  "claim-verification": "Claim Verifier",
  trace: "TRACE",
  c3m: "C3M",
};

/** where a skill is used: every project whose tags and every role whose stack
 *  list one of its `match` spellings, then its `extra` places. Empty when
 *  nothing says so — the caption then stays blank rather than guess. */
export function usedIn(skill: { match: string[]; extra?: string[] }): string[] {
  const want = new Set(skill.match.map((m) => m.toLowerCase()));
  const hit = (list?: string[]) => !!list?.some((t) => want.has(t.toLowerCase()));
  return [
    ...PROJECTS.filter((p) => hit(p.tags)).map((p) => SHORT[p.slug] ?? p.name),
    ...EXPERIENCE.filter((r) => hit(r.stack)).map((r) => SHORT[r.slug] ?? r.role),
    ...(skill.extra ?? []),
  ];
}
