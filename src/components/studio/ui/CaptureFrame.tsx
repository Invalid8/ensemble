"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function FaceGuide() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden>
      <ellipse cx="100" cy="120" rx="58" ry="76" fill="#ffffff10" stroke="#faf6f0" strokeWidth="2" />
    </svg>
  );
}

function BodyGuide() {
  return (
    <svg viewBox="0 0 200 300" className="h-full w-full" aria-hidden>
      <circle cx="100" cy="58" r="20" fill="#ffffff10" stroke="#faf6f0" strokeWidth="2" />
      <path
        d="M64 96 Q84 82 100 96 Q116 82 136 96 L150 150 L132 160 L132 268 Q100 280 68 268 L68 160 L50 150 Z"
        fill="#ffffff10"
        stroke="#faf6f0"
        strokeWidth="2"
      />
    </svg>
  );
}

function CameraGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 4a1 1 0 0 0-.8.4L7.2 5.8A1 1 0 0 1 6.4 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1.4a1 1 0 0 1-.8-.4l-1-1.4A1 1 0 0 0 15 4H9zm3 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"
      />
    </svg>
  );
}

interface CaptureFrameProps {
  guide: "face" | "body";
  hint?: string;
  preview: string | null;
  onFile: (file: File) => void;
}

type Mode = "idle" | "live" | "preview";

const FRAME_CLASS =
  "relative w-full min-h-[240px] flex-1 overflow-hidden rounded-[var(--radius-xl)] shadow-[0_18px_44px_rgba(26,26,26,0.10)]";
const FRAME_BG = { backgroundImage: "linear-gradient(135deg, #ead9c6, #d9c3ac)" } as const;

export function CaptureFrame({ guide, hint, preview, onFile }: CaptureFrameProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<Mode>(preview ? "preview" : "idle");
  const [camError, setCamError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  useEffect(() => {
    if (preview) setMode((m) => (m === "live" ? m : "preview"));
  }, [preview]);

  // Attach the stream once the <video> is actually in the DOM.
  useEffect(() => {
    if (mode === "live" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [mode]);

  const startCamera = useCallback(async () => {
    setCamError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      inputRef.current?.click();
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: guide === "face" ? "user" : "environment" },
        audio: false,
      });
      setMode("live");
    } catch {
      setCamError("We couldn't reach your camera - you can upload a photo instead.");
    }
  }, [guide]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        onFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
        setMode("preview");
      },
      "image/jpeg",
      0.92
    );
  }, [onFile, stopStream]);

  const Guide = guide === "face" ? FaceGuide : BodyGuide;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {mode === "idle" && !preview ? (
        <button type="button" onClick={startCamera} className={cn(FRAME_CLASS, "group")} style={FRAME_BG} aria-label="Open camera">
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-transform group-hover:scale-105 group-active:scale-95">
              <CameraGlyph className="h-11 w-11 text-white" />
            </span>
            <span className="font-body text-sm font-semibold text-white drop-shadow">Tap to open your camera</span>
          </span>
          {hint && (
            <span className="absolute left-4 top-4 max-w-[80%] rounded-full bg-surface-card/95 px-3.5 py-2 font-body text-[11px] font-medium text-ink">
              {hint}
            </span>
          )}
        </button>
      ) : (
        <div className={FRAME_CLASS} style={FRAME_BG}>
          {mode === "live" ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={cn("h-full w-full object-cover", guide === "face" && "-scale-x-100")}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 opacity-60">
                <Guide />
              </div>
              <button
                type="button"
                onClick={capture}
                aria-label="Take photo"
                className="absolute bottom-5 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full border-4 border-white/90 bg-white/30 backdrop-blur transition-transform active:scale-95"
              >
                <span className="absolute inset-1.5 rounded-full bg-white" />
              </button>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview ?? ""} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      )}

      {mode === "live" ? (
        <button
          type="button"
          onClick={() => {
            stopStream();
            setMode(preview ? "preview" : "idle");
          }}
          className="mx-auto font-body text-sm text-ink-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
      ) : preview ? (
        <div className="flex items-center justify-center gap-4 font-body text-sm">
          <button type="button" onClick={startCamera} className="font-semibold text-accent transition-colors hover:text-accent/80">
            Retake
          </button>
          <span className="text-border-subtle">·</span>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-ink-muted transition-colors hover:text-ink">
            Upload a photo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto font-body text-sm text-ink-muted transition-colors hover:text-ink"
        >
          Or upload a photo instead
        </button>
      )}

      {camError && <p className="text-center font-body text-xs text-destructive">{camError}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={guide === "face" ? "user" : "environment"}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}
