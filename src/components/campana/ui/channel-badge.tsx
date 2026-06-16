import { CHANNELS } from "@/lib/campana/constants";
import type { ChannelKey } from "@/lib/campana/types";

export function ChannelBadge({
  channel,
  showSubtitle = false,
}: {
  channel: ChannelKey;
  showSubtitle?: boolean;
}) {
  const meta = CHANNELS[channel];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      <span className="font-semibold text-[var(--text)]">{meta.label}</span>
      {showSubtitle && <span className="text-xs text-[var(--text-dim)]">· {meta.subtitle}</span>}
    </span>
  );
}
