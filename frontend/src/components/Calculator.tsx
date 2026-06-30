import { useState } from "react";
import { playSfx } from "../sound";

const KEYS = [
  "C", "±", "%", "÷",
  "7", "8", "9", "×",
  "4", "5", "6", "−",
  "1", "2", "3", "+",
  "0", ".", "=",
];

export default function Calculator() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");

  function press(key: string) {
    playSfx("drop");
    if (key === "C") {
      setExpression("");
      setResult("0");
      return;
    }
    if (key === "±") {
      setExpression((e) => (e.startsWith("-") ? e.slice(1) : `-${e}`));
      return;
    }
    if (key === "=") {
      try {
        const sanitized = expression.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/%/g, "/100");
        if (!/^[0-9+\-*/.() ]*$/.test(sanitized) || !sanitized) return;
        // eslint-disable-next-line no-new-func
        const value = Function(`"use strict";return (${sanitized})`)();
        setResult(String(Number.isFinite(value) ? Math.round(value * 1e8) / 1e8 : "Erro"));
      } catch {
        setResult("Erro");
      }
      return;
    }
    setExpression((e) => e + key);
  }

  return (
    <div className="calculator">
      <div className="calculator-display">
        <div className="calculator-expression">{expression || " "}</div>
        <div className="calculator-result">{result}</div>
      </div>
      <div className="calculator-grid">
        {KEYS.map((key) => (
          <button
            key={key}
            className={`calc-key${["÷", "×", "−", "+", "="].includes(key) ? " calc-key-op" : ""}${
              key === "0" ? " calc-key-wide" : ""
            }`}
            onClick={() => press(key)}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
