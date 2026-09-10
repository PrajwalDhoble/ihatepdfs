import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      style={{
        background: "none",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 16,
        color: "var(--color-ink)",
        flexShrink: 0,
      }}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
