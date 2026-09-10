"use client";

import { useState } from "react";
import { PROFILE, SKILLS, SKILL_LEVELS, type SkillLevel } from "@/lib/site";

/**
 * Skills as a terminal: a `neofetch`-style readout, with an optional `htop`
 * view where each skill is a "process" with a coarse 3-level load bar.
 */

const GLYPH = [
  "   ______  ",
  "  |  __  | ",
  "  | |  | | ",
  "  | |__| | ",
  "  |______| ",
  "   / __/   ",
  "  /_/  JC  ",
];

const ROWS: [string, string][] = [
  ["Languages", SKILLS.languages.join(", ")],
  ["Frameworks", SKILLS.frameworksTools.join(", ")],
  ["Hardware", SKILLS.hardware.join(", ")],
  ["School", "Computer Engineering, University of Waterloo"],
  ["Uptime", "since 2024 · co-op stream"],
  ["Shell", "zsh · nvim · arch, btw"],
];

const LEVEL_FILL: Record<SkillLevel, number> = {
  core: 3,
  working: 2,
  learning: 1,
};

export default function SkillsApp() {
  const [view, setView] = useState<"neofetch" | "htop">("neofetch");

  const allSkills = [
    ...SKILLS.languages,
    ...SKILLS.frameworksTools,
    ...SKILLS.hardware,
  ];

  return (
    <div className="bg-[color:var(--app-bg)] p-4 font-mono text-[13px] leading-6 sm:p-6">
      <div className="mb-3 flex items-center gap-2 text-[color:var(--app-fg-soft)]">
        <span style={{ color: "var(--accent)" }}>jayden@desk</span>
        <span>~</span>
        <span>%</span>
        <button
          type="button"
          onClick={() => setView(view === "neofetch" ? "htop" : "neofetch")}
          className="text-[color:var(--app-fg)] underline decoration-dotted underline-offset-4 hover:opacity-80"
        >
          {view === "neofetch" ? "neofetch" : "htop"}
        </button>
        <span className="text-[color:var(--app-fg-soft)]/50">
          (click to run {view === "neofetch" ? "htop" : "neofetch"})
        </span>
      </div>

      {view === "neofetch" ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
          <pre
            aria-hidden
            className="text-[color:var(--accent)]/80"
          >
            {GLYPH.join("\n")}
          </pre>
          <div className="min-w-0">
            <div className="text-[color:var(--app-fg)]">
              {PROFILE.name}
              <span className="text-[color:var(--app-fg-soft)]"> — jayden@desk</span>
            </div>
            <div className="mb-1 text-[color:var(--app-fg-soft)]/50">
              ───────────────────────
            </div>
            <table>
              <tbody>
                {ROWS.map(([k, v]) => (
                  <tr key={k} className="align-top">
                    <td className="pr-4 text-[color:var(--accent)] whitespace-nowrap">
                      {k}
                    </td>
                    <td className="text-[color:var(--app-fg-soft)]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 max-w-prose whitespace-normal font-sans text-sm text-[color:var(--app-fg-soft)]">
              The hardware line is real — there&apos;s a bench with a soldering
              iron and a parts bin behind the monitors. PCB work in KiCad,
              hand-assembly down to 0603.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-white/10 pb-1 text-[color:var(--app-fg-soft)]/60">
            <span>PROCESS</span>
            <span>LOAD</span>
            <span>STAT</span>
          </div>
          <ul>
            {allSkills.map((s) => {
              const level = SKILL_LEVELS[s] ?? "working";
              const fill = LEVEL_FILL[level];
              return (
                <li
                  key={s}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-0.5"
                >
                  <span className="text-[color:var(--app-fg)]">{s}</span>
                  <span aria-hidden style={{ color: "var(--accent)" }}>
                    {"█".repeat(fill)}
                    <span className="text-[color:var(--app-fg-soft)]/30">
                      {"░".repeat(3 - fill)}
                    </span>
                  </span>
                  <span className="text-[color:var(--app-fg-soft)]/70">{level}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
