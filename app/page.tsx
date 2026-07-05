"use client";

import { useCallback, useRef, useState } from "react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ProgressView } from "@/components/ProgressView";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import type { Summary, WorkerResponse } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "parsing"; phase: string; processed: number; total: number }
  | { status: "done"; summary: Summary }
  | { status: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<State>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);

  const startParsing = useCallback((file: File) => {
    const worker = new Worker("/worker.js");
    workerRef.current = worker;
    setState({ status: "parsing", phase: "Starting…", processed: 0, total: 1 });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === "progress") {
        setState({ status: "parsing", phase: msg.phase, processed: msg.processed, total: msg.total });
      } else if (msg.type === "result") {
        setState({ status: "done", summary: msg.summary });
        worker.terminate();
      } else if (msg.type === "error") {
        setState({ status: "error", message: msg.message });
        worker.terminate();
      }
    };
    worker.onerror = () => {
      setState({
        status: "error",
        message: "Something went wrong reading this file. Please try again.",
      });
      worker.terminate();
    };
    worker.postMessage({ type: "parse", file });
  }, []);

  function cancel() {
    workerRef.current?.terminate();
    setState({ status: "idle" });
  }

  function reset() {
    setState({ status: "idle" });
  }

  return (
    <div className="viz-root">
      <div className="wrap">
        <h1>Instagram Unwrapped</h1>
        <PrivacyNotice />

        {state.status === "idle" && <UploadDropzone onFile={startParsing} />}

        {state.status === "parsing" && (
          <ProgressView
            phase={state.phase}
            processed={state.processed}
            total={state.total}
            onCancel={cancel}
          />
        )}

        {state.status === "error" && (
          <div className="error-box">
            <div className="error-title">Couldn&rsquo;t read that file</div>
            <p>{state.message}</p>
            <button className="btn" onClick={reset} style={{ marginTop: 12 }}>
              Try again
            </button>
          </div>
        )}

        {state.status === "done" && (
          <div className="card">
            <h2>Done</h2>
            <p className="list-note">
              Parsed {state.summary.milestones.total_messages.toLocaleString()} messages across{" "}
              {state.summary.milestones.total_threads.toLocaleString()} conversations.
            </p>
            <button className="btn" onClick={reset} style={{ marginTop: 12 }}>
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
