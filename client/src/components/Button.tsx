import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const base: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontWeight: 600,
  borderRadius: "var(--radius-md)" as unknown as string,
  border: "1px solid transparent",
  cursor: "pointer",
  transition: "background-color 120ms ease, border-color 120ms ease, opacity 120ms ease, transform 100ms ease, box-shadow 120ms ease",
};

const sizes: Record<string, React.CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: 13 },
  md: { padding: "10px 18px", fontSize: 15 },
  lg: { padding: "14px 24px", fontSize: 16 },
};

const variants: Record<string, React.CSSProperties> = {
  primary: { background: "var(--color-primary)", color: "#fff", boxShadow: "0 1px 2px rgba(24,87,224,0.25)" },
  secondary: { background: "var(--color-bg-alt)", color: "var(--color-ink)", borderColor: "var(--color-border)" },
  ghost: { background: "transparent", color: "var(--color-primary)" },
  danger: { background: "var(--color-danger)", color: "#fff" },
};

export default function Button({
  variant = "primary",
  size = "md",
  style,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className="btn-polished"
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant],
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
