import { useEffect, useState } from "react";

function getRemaining(target: number): { d: number; h: number; m: number; s: number; done: boolean } {
  const diff = target - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
    done: false,
  };
}

export default function CountdownTimerTool() {
  const [targetInput, setTargetInput] = useState("");
  const [targetMs, setTargetMs] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(getRemaining(0));

  useEffect(() => {
    if (targetMs === null) return;
    const interval = setInterval(() => setRemaining(getRemaining(targetMs)), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  function handleStart() {
    const t = new Date(targetInput).getTime();
    if (Number.isNaN(t)) return;
    setTargetMs(t);
    setRemaining(getRemaining(t));
  }

  const box: React.CSSProperties = {
    padding: "16px 20px",
    background: "var(--color-bg-alt)",
    borderRadius: "var(--radius-md)",
    textAlign: "center",
    minWidth: 80,
  };

  return (
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-accent)",
          background: "#e6f9f2",
          padding: "4px 10px",
          borderRadius: 999,
          marginBottom: "var(--space-3)",
        }}
      >
        🔒 Runs entirely in your browser
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>
        Target date and time
        <input
          type="datetime-local"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
          style={{ display: "block", marginTop: 4, padding: "8px 10px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: 13 }}
        />
      </label>

      <button
        onClick={handleStart}
        style={{ padding: "10px 18px", borderRadius: "var(--radius-md)", border: "none", background: "var(--color-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
      >
        Start countdown
      </button>

      {targetMs !== null && (
        <div style={{ display: "flex", gap: 12, marginTop: "var(--space-5)" }}>
          {remaining.done ? (
            <p style={{ fontWeight: 700 }}>Time's up!</p>
          ) : (
            <>
              <div style={box}><div style={{ fontSize: 24, fontWeight: 800 }}>{remaining.d}</div><div style={{ fontSize: 11 }}>days</div></div>
              <div style={box}><div style={{ fontSize: 24, fontWeight: 800 }}>{remaining.h}</div><div style={{ fontSize: 11 }}>hours</div></div>
              <div style={box}><div style={{ fontSize: 24, fontWeight: 800 }}>{remaining.m}</div><div style={{ fontSize: 11 }}>minutes</div></div>
              <div style={box}><div style={{ fontSize: 24, fontWeight: 800 }}>{remaining.s}</div><div style={{ fontSize: 11 }}>seconds</div></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
