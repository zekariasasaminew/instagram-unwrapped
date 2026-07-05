"use client";

import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("idle");

  function testWorker() {
    setStatus("pinging...");
    const worker = new Worker("/worker.js");
    worker.onmessage = (event) => {
      if (event.data?.type === "pong") {
        setStatus(`worker responded at ${event.data.receivedAt}`);
        worker.terminate();
      }
    };
    worker.onerror = (err) => {
      setStatus(`worker error: ${err.message}`);
    };
    worker.postMessage({ type: "ping" });
  }

  return (
    <div className="viz-root">
      <div className="wrap">
        <h1>Instagram Unwrapped</h1>
        <p className="subtitle">
          Drop your Instagram data export below to see your personal
          dashboard. Nothing is ever uploaded — everything runs in your
          browser.
        </p>
        <button className="btn" onClick={testWorker}>
          Test worker (spike)
        </button>
        <p className="list-note">{status}</p>
      </div>
    </div>
  );
}
