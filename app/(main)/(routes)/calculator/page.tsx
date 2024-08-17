"use client";
import React, { useState, ChangeEvent } from "react";
import "./app.css";
import * as math from "mathjs";

function App() {
  const [expression, setExpression] = useState<string>("");
  const [screenVal, setScreenVal] = useState<string>("");
  const [customVariables, setCustomVariables] = useState<
    Record<string, number>
  >({});
  // Default mode is "rad"
  const [mode, setMode] = useState<"rad" | "deg">("rad");

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setExpression(e.target.value);
  }

  function handleClick(input: string) {
    setExpression((prevExpression) => prevExpression + input);
  }

  function calculate() {
    try {
      const allVariables: Record<string, any> = {
        ...customVariables,
        pi: Math.PI,
        e: Math.E,
        // Add factorial function
        fact: math.factorial,
        sin: mode === "rad" ? Math.sin : math.sin,
        cos: mode === "rad" ? Math.cos : math.cos,
        tan: mode === "rad" ? Math.tan : math.tan,
        asin: mode === "rad" ? Math.asin : math.asin,
        acos: mode === "rad" ? Math.acos : math.acos,
        atan: mode === "rad" ? Math.atan : math.atan,
      };

      const result = math.evaluate(expression, allVariables);
      if (typeof result === "number" && !isNaN(result)) {
        setScreenVal(Number(result).toFixed(4));
      } else {
        setScreenVal("Error: Invalid expression");
      }
    } catch (error) {
      setScreenVal("Error: Invalid expression");
    }
  }

  function clearScreen() {
    setExpression("");
    setScreenVal("");
  }

  function backspace() {
    const newExpression = expression.slice(0, -1);
    setExpression(newExpression);
  }

  function toggleMode() {
    // Toggle between "rad" and "deg" modes
    setMode(mode === "rad" ? "deg" : "rad");
  }

  return (
    <>
      <div className="App">
        <div className="calc-body">
          <h1>Scientific Calculator</h1>
          <div className="input-section">
            <input
              className="screen"
              type="text"
              value={expression}
              onChange={handleChange}
            />
            <div className="output">Output: {screenVal}</div>
          </div>
          <div className="button-section">
            <div className="numeric-pad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(
                (input) => (
                  <button key={input} onClick={() => handleClick(input)}>
                    {input}
                  </button>
                )
              )}
              <button onClick={() => handleClick(".")}>.</button>
            </div>
            <div className="operators">
              {[
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
                // Add open parenthesis
                "(",
                // Add close parenthesis
                ")",
              ].map((input) => (
                <button key={input} onClick={() => handleClick(input)}>
                  {input}
                </button>
              ))}

              <button onClick={() => handleClick("pi")}>Pi</button>
              <button onClick={() => handleClick("fact(")}>Factorial</button>
            </div>
            <div className="control-buttons">
              <button className="clear-button" onClick={clearScreen}>
                C
              </button>
              <button className="equals-button" onClick={calculate}>
                =
              </button>
              <button className="backspace-button" onClick={backspace}>
                del
              </button>
            </div>
          </div>
        </div>
        <div className="variables"></div>
      </div>
    </>
  );
}

export default App;
