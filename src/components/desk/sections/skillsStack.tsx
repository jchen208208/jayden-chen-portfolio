"use client";

import { useState } from "react";
import { TOOLS, type ToolItem } from "../skillItems";
import type { CardOptions } from "./shared";
import { PAD, SkillPane, UsedIn } from "./skillsKit";
import { usedIn } from "./usedIn";

/**
 * Frameworks & Tools as a wired diagram. The web stack is one chain down the
 * left, the maths and ML libraries another on the right, and Git is the commit
 * rail under both. Every so often one chain carries a pulse: a short amber
 * comet runs down its wire and each box lights as it arrives, then cools. The
 * Git rail's HEAD just breathes. Boxes are ink; hovering one lights it and
 * dims the rest, with where it was used underneath.
 *
 * Everything is drawn in a 300 x 380 box that scales with the card.
 */

const VIEW_W = 300;
const VIEW_H = 380;
const NODE_W = 112;
const NODE_H = 48;
// the pulses' timings below are seconds into the 10 s loop that `.sk-lit` and
// the `.sk-comet-*` keyframes in globals.css run on

type Node = { name: string; cx: number; cy: number };

const WEB: Node[] = [
  { name: "Next.js", cx: 78, cy: 48 },
  { name: "Supabase", cx: 78, cy: 150 },
  { name: "PostgreSQL", cx: 78, cy: 252 },
];
const ML: Node[] = [
  { name: "NumPy", cx: 222, cy: 99 },
  { name: "PyTorch", cx: 222, cy: 201 },
];

/** a pulse's route (centre to centre, so the boxes cover its ends) and when it
 *  runs: it leaves at `start` and takes `sweep` seconds. A box lights as the
 *  comet reaches its top edge. */
type Chain = { nodes: Node[]; start: number; sweep: number; comet: string };
const CHAINS: Chain[] = [
  { nodes: WEB, start: 0.6, sweep: 3.6, comet: "sk-comet-web" },
  { nodes: ML, start: 5.4, sweep: 3, comet: "sk-comet-ml" },
];

/** seconds into the cycle that the comet reaches node `i` of a chain */
function arrival(chain: Chain, i: number) {
  const { nodes, start, sweep } = chain;
  const first = nodes[0].cy;
  const total = nodes[nodes.length - 1].cy - first;
  const edge = i === 0 ? first : nodes[i].cy - NODE_H / 2;
  return start + (sweep * (edge - first)) / total;
}

const tool = (name: string): ToolItem => TOOLS.find((t) => t.name === name)!;

/** the Git rail: a main line with one branch off it, commits along both */
const RAIL_Y = 336;
const BRANCH_Y = 322;
const MAIN_COMMITS = [40, 72, 100, 204, 232, 262];
const BRANCH_COMMITS = [132, 168];

function Box({ node, lit, delay }: { node: Node; lit: boolean; delay: number }) {
  const { Icon, name } = tool(node.name);
  const x = node.cx - NODE_W / 2;
  const y = node.cy - NODE_H / 2;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={10}
        fill="var(--paper, #000)"
        stroke="currentColor"
        strokeWidth={1.8}
      />
      {/* the amber outline sits on top and only ever fades in and out */}
      <rect
        className="sk-lit sk-anim"
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={10}
        style={{ animationDelay: `${(delay - 0.3).toFixed(2)}s` }}
      />
      <Icon x={x + 13} y={node.cy - 11} size={22} />
      <text
        x={x + 42}
        y={node.cy}
        dominantBaseline="central"
        fill="currentColor"
        fontSize={9.5}
        letterSpacing={0.2}
        className="font-mono uppercase"
      >
        {name}
      </text>
      <circle className="sk-pick" data-on={lit} cx={x + NODE_W - 9} cy={y + 9} r={3.2} />
    </>
  );
}

function Diagram({ hover, setHover }: { hover: string | null; setHover: (n: string | null) => void }) {
  const dim = (name: string) => hover !== null && hover !== name;
  const group = (name: string) => ({
    "data-dim": dim(name),
    onMouseEnter: () => setHover(name),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(name),
    onBlur: () => setHover(null),
    tabIndex: 0,
    role: "img",
    "aria-label": name,
    className: "sk-dim outline-none",
  });

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="min-h-0 w-full flex-1 text-white"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* wires: the chains' links in faint ink, with the comet on top */}
      <g stroke="currentColor" strokeWidth={1.8} opacity={0.4}>
        {CHAINS.map(({ nodes }) => (
          <path
            key={nodes[0].name}
            d={`M${nodes[0].cx} ${nodes[0].cy} V${nodes[nodes.length - 1].cy}`}
          />
        ))}
      </g>
      {CHAINS.map(({ nodes, comet }) => (
        <path
          key={nodes[0].name}
          className={`sk-comet sk-anim ${comet}`}
          pathLength={100}
          d={`M${nodes[0].cx} ${nodes[0].cy} V${nodes[nodes.length - 1].cy}`}
        />
      ))}

      {CHAINS.flatMap((chain) =>
        chain.nodes.map((node, i) => (
          <g key={node.name} {...group(node.name)}>
            <Box node={node} lit={hover === node.name} delay={arrival(chain, i)} />
          </g>
        )),
      )}

      {/* Git: main line, a branch that leaves and rejoins at 45 degrees, commits */}
      <g {...group("Git/GitHub")}>
        <path
          d={`M24 ${RAIL_Y} H276 M100 ${RAIL_Y} L${100 + 14} ${BRANCH_Y} H${204 - 14} L204 ${RAIL_Y}`}
          stroke="currentColor"
          strokeWidth={1.8}
        />
        {MAIN_COMMITS.map((x) => (
          <circle key={x} cx={x} cy={RAIL_Y} r={4} fill="var(--paper, #000)" stroke="currentColor" strokeWidth={1.8} />
        ))}
        {BRANCH_COMMITS.map((x) => (
          <circle key={x} cx={x} cy={BRANCH_Y} r={4} fill="var(--paper, #000)" stroke="currentColor" strokeWidth={1.8} />
        ))}
        <circle
          className="sk-head sk-anim"
          cx={MAIN_COMMITS[MAIN_COMMITS.length - 1]}
          cy={RAIL_Y}
          r={8}
          stroke="currentColor"
          strokeWidth={1.8}
        />
        {(() => {
          const { Icon, name } = tool("Git/GitHub");
          return (
            <>
              <Icon x={24} y={351} size={18} />
              <text
                x={50}
                y={360}
                dominantBaseline="central"
                fill="currentColor"
                fontSize={11}
                letterSpacing={0.4}
                className="font-mono uppercase"
              >
                {name}
              </text>
              <circle className="sk-pick" data-on={hover === name} cx={276} cy={360} r={3.2} />
            </>
          );
        })()}
      </g>
    </svg>
  );
}

function Stack() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className="flex h-full w-full flex-col" style={{ padding: PAD, gap: "1cqw" }}>
      <Diagram hover={hover} setHover={setHover} />
      <UsedIn names={hover ? usedIn(tool(hover)) : []} />
    </div>
  );
}

export default function StackBody(opts: CardOptions) {
  return (
    <SkillPane {...opts} aspect="3 / 4.5">
      <Stack />
    </SkillPane>
  );
}
