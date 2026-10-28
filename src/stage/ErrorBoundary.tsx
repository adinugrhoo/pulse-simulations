"use client";

import { Component, type ReactNode } from "react";
import { useMenuStore } from "@/menu/store";

/**
 * Keeps one broken area (a device, the studio) from taking down the whole stage. Menu
 * drafts load from localStorage on every visit, so a bad draft would otherwise crash
 * every reload; the fallback offers to drop them.
 */
export class StageErrorBoundary extends Component<{ label: string; children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-semibold text-red-300">{this.props.label} failed to render</p>
        <p className="max-w-md font-mono text-[11px] break-words text-neutral-400">{error.message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => {
              const s = useMenuStore.getState();
              [...(s.drafts.global ? ["global"] : []), ...Object.keys(s.drafts.patches)].forEach(s.discard);
              this.setState({ error: null });
            }}
            className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900"
          >
            Discard unsaved menu edits
          </button>
        </div>
      </div>
    );
  }
}
