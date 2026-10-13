import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "ready" | "unavailable";

/**
 * Live rear-camera preview with a snapshot function. When the camera is
 * unavailable or denied, the caller falls back to the system photo picker.
 */
export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");

  useEffect(() => {
    if (!active) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => {});
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  const snapshot = useCallback(
    () =>
      new Promise<Blob>((resolve, reject) => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) {
          reject(new Error("Camera is not ready"));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Could not read the frame"))),
          "image/jpeg",
          0.85,
        );
      }),
    [],
  );

  return { videoRef, status, snapshot };
}
