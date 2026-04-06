"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface ResumeUploadCardProps {
  onUploaded: () => void;
}

export function ResumeUploadCard({ onUploaded }: ResumeUploadCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/data", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-5 bg-white dark:bg-stone-900 flex flex-col">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-[11px] font-bold text-stone-500 dark:text-stone-400">
          upload_resume
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume PDF"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
          }
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all
          ${dragOver
            ? "border-orange-500 bg-orange-600/10"
            : "border-stone-300 dark:border-stone-700 hover:border-orange-500/50 hover:bg-orange-600/5"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-2" />
            <p className="text-[11px] text-orange-500 font-mono">processing...</p>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-stone-400 mb-2" />
            <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center">
              Drop your resume PDF here
            </p>
            <p className="text-[10px] text-stone-400 mt-1">or click to browse</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-400 font-mono mt-2">✗ {error}</p>
      )}

      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <FileText className="w-3 h-3 text-orange-600" />
          <span>AI extracts skills &amp; generates match scores</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <span className="text-orange-600 ml-[1px]">✦</span>
          <span>Your PDF format is never modified</span>
        </div>
      </div>
    </div>
  );
}
