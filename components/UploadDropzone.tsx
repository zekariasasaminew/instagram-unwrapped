"use client";

import { useRef, useState } from "react";

export function UploadDropzone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      className={`dropzone${dragOver ? " dragover" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="dropzone-title">Drop your Instagram export here</div>
      <div className="dropzone-note">
        or click to choose the .zip file Instagram sent you
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className="file-input-visually-hidden"
        aria-label="Choose Instagram export zip file"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
