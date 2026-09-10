import type { ReactNode } from "react";

/**
 * Neutral "application window" chrome shared by all four sections: a titlebar
 * with traffic-light dots + the app name, a 1px accent frame, and an optional
 * status bar. Only this shell is named for the view-transition morph — the body
 * crossfades separately — so the desk-rect → fullscreen interpolation never has
 * to warp real content.
 */
export default function AppWindow({
  appName,
  toolbar,
  statusbar,
  onClose,
  children,
}: {
  appName: string;
  /** optional strip under the titlebar (tabs, menu, filter pills) */
  toolbar?: ReactNode;
  /** optional left-aligned status bar text */
  statusbar?: ReactNode;
  onClose?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[color:var(--app-bg)] text-[color:var(--app-fg)] ring-1 ring-inset ring-[color:var(--accent)]/40">
      {/* titlebar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-white/15" />
          <span className="h-3 w-3 rounded-full bg-white/15" />
          <span className="h-3 w-3 rounded-full bg-[color:var(--accent)]/70" />
        </div>
        <span className="font-mono text-xs tracking-wide text-[color:var(--app-fg-soft)]">
          {appName}
        </span>
        <div className="ml-auto">{onClose}</div>
      </div>

      {toolbar && (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-white/[0.015] px-4 py-2">
          {toolbar}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {statusbar && (
        <div className="flex items-center gap-3 border-t border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[11px] text-[color:var(--app-fg-soft)]">
          {statusbar}
        </div>
      )}
    </div>
  );
}
