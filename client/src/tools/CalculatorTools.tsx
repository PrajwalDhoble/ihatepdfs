import { useState } from "react";
import { calculateEmi } from "@/lib/textTools";

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  fontSize: 13,
};

const badge = (
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
);

export function PercentageCalculatorTool() {
  const [value, setValue] = useState("");
  const [percent, setPercent] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function calculate() {
    const v = Number(value);
    const p = Number(percent);
    if (Number.isNaN(v) || Number.isNaN(p)) {
      setResult(null);
      return;
    }
    setResult(`${p}% of ${v} = ${((v * p) / 100).toFixed(2)}`);
  }

  return (
    <div>
      {badge}
      <label style={{ fontSize: 13, fontWeight: 600 }}>
        Value
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} style={fieldStyle} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginTop: 10 }}>
        Percentage (%)
        <input type="number" value={percent} onChange={(e) => setPercent(e.target.value)} style={fieldStyle} />
      </label>
      <button
        onClick={calculate}
        style={{ marginTop: 14, padding: "10px 18px", borderRadius: "var(--radius-md)", border: "none", background: "var(--color-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
      >
        Calculate
      </button>
      {result && <p style={{ marginTop: 12, fontWeight: 700 }}>{result}</p>}
    </div>
  );
}

export function LoanEmiCalculatorTool() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [months, setMonths] = useState("");
  const [emi, setEmi] = useState<number | null>(null);

  function calculate() {
    const p = Number(principal);
    const r = Number(rate);
    const m = Number(months);
    if (!p || !r || !m) {
      setEmi(null);
      return;
    }
    setEmi(calculateEmi(p, r, m));
  }

  return (
    <div>
      {badge}
      <label style={{ fontSize: 13, fontWeight: 600 }}>
        Loan amount (principal)
        <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} style={fieldStyle} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginTop: 10 }}>
        Annual interest rate (%)
        <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} style={fieldStyle} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginTop: 10 }}>
        Term (months)
        <input type="number" value={months} onChange={(e) => setMonths(e.target.value)} style={fieldStyle} />
      </label>
      <button
        onClick={calculate}
        style={{ marginTop: 14, padding: "10px 18px", borderRadius: "var(--radius-md)", border: "none", background: "var(--color-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
      >
        Calculate EMI
      </button>
      {emi !== null && <p style={{ marginTop: 12, fontWeight: 700 }}>Monthly payment: {emi.toLocaleString(undefined, { style: "currency", currency: "USD" })}</p>}
    </div>
  );
}
