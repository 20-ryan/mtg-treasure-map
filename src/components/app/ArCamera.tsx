import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Rear-camera stream for AR mode. Fully optional: when getUserMedia is missing
 * or denied, `error` is set and callers fall back to the non-AR experience.
 */
export function useCameraStream(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError("This device doesn't support in-browser AR camera access.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);
        setError(null);
      } catch {
        setError("Camera access was blocked. Allow the camera to use AR mode.");
      }
    }
    void start();

    return () => {
      cancelled = true;
      setReady(false);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  /** Grab the current frame as a JPEG data URL. */
  const capture = useCallback((maxWidth = 900) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  }, []);

  return { videoRef, ready, error, capture };
}

/** Lightweight CSS particle burst used behind AR overlays. */
export function ArParticles({ count = 14, className = "" }: { count?: number; className?: string }) {
  const sparks = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return {
      dx: `${Math.cos(angle) * 70}px`,
      dy: `${Math.sin(angle) * 70}px`,
      delay: `${(i % 5) * 0.22}s`,
    };
  });
  return (
    <div className={`pointer-events-none absolute inset-0 grid place-items-center ${className}`} aria-hidden>
      {sparks.map((s, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.8)]"
          style={
            {
              "--dx": s.dx,
              "--dy": s.dy,
              animation: `ar-spark 2.4s ease-out ${s.delay} infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}