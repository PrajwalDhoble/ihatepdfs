interface AdSlotProps {
  placement: "below-nav" | "below-tool" | "in-content" | "sidebar" | "lower-page";
  /** Set to false to hide ads entirely (e.g. for Pro users, once implemented). */
  enabled?: boolean;
}

const sizeByPlacement: Record<AdSlotProps["placement"], { minHeight: number; label: string }> = {
  "below-nav": { minHeight: 90, label: "Advertisement" },
  "below-tool": { minHeight: 100, label: "Advertisement" },
  "in-content": { minHeight: 120, label: "Advertisement" },
  sidebar: { minHeight: 250, label: "Advertisement" },
  "lower-page": { minHeight: 100, label: "Advertisement" },
};

/**
 * Placeholder, provider-agnostic ad slot. No ad network is wired up yet —
 * this reserves layout space and keeps ad placement decoupled from business
 * logic so a real provider (AdSense, etc.) can be dropped in later without
 * touching tool pages. Never rendered over upload/download controls.
 */
export default function AdSlot({ placement, enabled = true }: AdSlotProps) {
  if (!enabled) return null;
  const { minHeight, label } = sizeByPlacement[placement];

  return (
    <div
      data-ad-placement={placement}
      role="complementary"
      aria-label={label}
      style={{
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-alt)",
        border: "1px dashed var(--color-border)",
        borderRadius: "var(--radius-md)",
        color: "var(--color-ink-soft)",
        fontSize: 12,
        margin: "var(--space-5) 0",
      }}
    >
      {label}
    </div>
  );
}
