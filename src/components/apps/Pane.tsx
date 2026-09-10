import type { ReactNode } from "react";

/**
 * Sidebar + main split used by the Projects (file tree) and About (note list)
 * apps. On narrow widths the sidebar collapses to a horizontal scroller above
 * the main pane.
 */
export default function Pane({
  sidebar,
  sidebarLabel,
  children,
}: {
  sidebar: ReactNode;
  sidebarLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col sm:flex-row">
      <aside
        aria-label={sidebarLabel}
        className="shrink-0 border-b border-white/10 bg-white/[0.02] p-2 sm:w-56 sm:overflow-y-auto sm:border-b-0 sm:border-r"
      >
        {sidebar}
      </aside>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
