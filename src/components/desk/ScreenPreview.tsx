import type { SectionId } from "@/lib/site";
import { SECTIONS } from "@/lib/site";

/**
 * The tiny fake-UI shown on a screen while it sits on the desk. Pure CSS, no
 * real text (the wrapping <Link> carries the label). Shares a visual language
 * with the full app so the morph doesn't jump.
 */
export default function ScreenPreview({ id }: { id: SectionId }) {
  const accent = `var(${SECTIONS[id].accentVar})`;
  return (
    <div
      aria-hidden
      className="pointer-events-none h-full w-full overflow-hidden bg-[#0b0d10] ring-1 ring-inset ring-white/10"
      style={{ ["--accent" as string]: accent }}
    >
      {/* faux titlebar */}
      <div className="flex items-center gap-[3px] border-b border-white/10 px-[6px] py-[4px]">
        <span className="h-[4px] w-[4px] rounded-full bg-white/20" />
        <span className="h-[4px] w-[4px] rounded-full bg-white/20" />
        <span className="h-[4px] w-[4px] rounded-full" style={{ background: accent }} />
        <span className="ml-1 h-[3px] w-10 rounded bg-white/10" />
      </div>
      <div className="p-[7px]">{BODIES[id]}</div>
    </div>
  );
}

const bar = (w: string, dim = false) => (
  <span
    className="block h-[3px] rounded"
    style={{ width: w, background: dim ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.28)" }}
  />
);

const BODIES: Record<SectionId, React.ReactNode> = {
  projects: (
    <div className="flex gap-[6px]">
      <div className="flex w-1/4 flex-col gap-[4px]">
        {bar("100%", true)}
        {bar("80%", true)}
        {bar("90%", true)}
      </div>
      <div className="flex flex-1 flex-col gap-[4px]">
        <span className="block h-[4px] w-1/2 rounded" style={{ background: "var(--accent)" }} />
        {bar("95%")}
        {bar("70%")}
        {bar("85%")}
        {bar("60%")}
      </div>
    </div>
  ),
  experience: (
    <div className="flex flex-col gap-[6px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-[5px]">
          <span
            className="h-[5px] w-[5px] shrink-0 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <div className="flex flex-1 flex-col gap-[3px]">
            {bar(`${80 - i * 12}%`)}
            {bar("50%", true)}
          </div>
        </div>
      ))}
    </div>
  ),
  skills: (
    <div className="flex flex-col gap-[4px] font-mono">
      <div className="flex gap-[4px]">
        <span className="h-[3px] w-6 rounded" style={{ background: "var(--accent)" }} />
        {bar("40%", true)}
      </div>
      {bar("75%")}
      {bar("88%")}
      {bar("62%")}
      {bar("70%")}
    </div>
  ),
  about: (
    <div className="flex flex-col gap-[5px]">
      <span className="block h-[4px] w-2/5 rounded" style={{ background: "var(--accent)" }} />
      {bar("92%")}
      {bar("85%")}
      {bar("88%")}
      {bar("55%")}
    </div>
  ),
};
