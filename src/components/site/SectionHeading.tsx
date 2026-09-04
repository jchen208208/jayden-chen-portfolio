import type { ReactNode } from "react";
import Reveal from "./Reveal";

type Props = {
  /** the oversized faint word behind the title */
  watermark: string;
  /** small mono kicker above the title */
  kicker?: string;
  /** the bold title; wrap the accent bit in <Accent> */
  children: ReactNode;
};

export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-ember">{children}</span>;
}

export default function SectionHeading({ watermark, kicker, children }: Props) {
  return (
    <div className="relative mb-14 sm:mb-20">
      <span
        aria-hidden
        className="watermark absolute -left-1 -top-10 text-[22vw] sm:-top-16 sm:text-[13rem]"
      >
        {watermark}
      </span>
      <div className="relative">
        {kicker && (
          <Reveal>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.35em] text-ink-faint">
              {kicker}
            </p>
          </Reveal>
        )}
        <Reveal delay={0.05}>
          <h2 className="font-display text-4xl font-normal tracking-tight text-ink sm:text-5xl">
            {children}
          </h2>
        </Reveal>
      </div>
    </div>
  );
}
