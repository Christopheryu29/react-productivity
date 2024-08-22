"use client";
import React, { useState, ChangeEvent } from "react";

function App() {
  const [expression, setExpression] = useState<string>("");
  const [screenVal, setScreenVal] = useState<string>("");
  const [customVariables, setCustomVariables] = useState<
    Record<string, number>
  >({});
  const [mode, setMode] = useState<"rad" | "deg">("rad");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setExpression(e.target.value);
  };

  const handleClick = (input: string) => {
    setExpression((prevExpression) => prevExpression + input);
  };

  // Explicitly define the return type as number
  const factorial = (n: number): number => {
    return n <= 1 ? 1 : n * factorial(n - 1);
  };

  const calculate = () => {
    try {
      const allVariables = {
        ...customVariables,
        pi: Math.PI,
        e: Math.E,
        fact: factorial, // Use the factorial function with a defined return type
        sin:
          mode === "rad"
            ? Math.sin
            : (x: number) => Math.sin((x * Math.PI) / 180),
        cos:
          mode === "rad"
            ? Math.cos
            : (x: number) => Math.cos((x * Math.PI) / 180),
        tan:
          mode === "rad"
            ? Math.tan
            : (x: number) => Math.tan((x * Math.PI) / 180),
      };

      const result = eval(expression.replaceAll(/(\d+)(!)/g, "fact($1)"));
      setScreenVal(
        typeof result === "number" ? result.toFixed(4) : "Invalid input"
      );
    } catch (error) {
      setScreenVal("Error: Invalid expression");
    }
  };

  const clearScreen = () => {
    setExpression("");
    setScreenVal("");
  };

  const backspace = () => {
    setExpression(expression.slice(0, -1));
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "white",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          border: "2px solid #ccc",
          padding: "20px",
          borderRadius: "10px",
          backgroundColor: "#333",
          width: "auto",
          maxWidth: "600px",
        }}
      >
        <h1>Scientific Calculator</h1>
        <div style={{ marginBottom: "20px" }}>
          <input
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              marginBottom: "10px",
              color: "black",
            }} // Set text color to black
            type="text"
            value={expression}
            onChange={handleChange}
          />
          <div
            style={{
              fontSize: "20px",
              padding: "10px",
              backgroundColor: "#222",
              marginBottom: "20px",
            }}
          >
            Output: {screenVal}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
          }}
        >
          {[
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "0",
            ".",
            "+",
            "-",
            "*",
            "/",
            "^",
            "sqrt(",
            "sin(",
            "cos(",
            "tan(",
            "cbrt(",
            "asin(",
            "acos(",
            "atan(",
            "(",
            ")",
            "pi",
            "fact(",
          ].map((input) => (
            <button
              key={input}
              onClick={() => handleClick(input)}
              style={{
                padding: "10px",
                borderRadius: "5px",
                backgroundColor: "#555",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#666")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#555")
              }
            >
              {input}
            </button>
          ))}
          <button
            style={{
              gridColumn: "span 2",
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
            onClick={clearScreen}
          >
            Clear
          </button>
          <button
            style={{
              gridColumn: "span 2",
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
            onClick={calculate}
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
