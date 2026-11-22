import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "starting" | "ready" | "unavailable";

/**
 * Live rear-camera preview with a snapshot function. When the camera is
 * unavailable, denied or slow to start, the caller falls back to the
 * phone's own camera app through a file input.
 *
 * The stream is kept in a ref and attached whenever the <video> element is
 * mounted (callback ref), so it does not matter which one is ready first.
 */
export function useCamera(active: boolean) {
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("starting");

  const attach = useCallback(() => {
    const video = videoEl.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    void video.play().catch(() => {});
  }, []);

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoEl.current = node;
      attach();
    },
    [attach],
  );

  useEffect(() => {
    if (!active) return;
    setStatus("starting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }

    let cancelled = false;
    // If the preview has not produced a frame after a few seconds, offer the fallback.
    const slow = window.setTimeout(() => {
      if (!cancelled && !videoEl.current?.videoWidth) setStatus("unavailable");
    }, 6000);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        attach();
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(slow);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoEl.current) videoEl.current.srcObject = null;
    };
  }, [active, attach]);

  /** Wire to the video's onLoadedData/onPlaying so "ready" means a real frame exists. */
  const markReady = useCallback(() => {
    if (videoEl.current?.videoWidth) setStatus("ready");
  }, []);

  const snapshot = useCallback(
    () =>
      new Promise<Blob>((resolve, reject) => {
        const video = videoEl.current;
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

  return { videoRef, status, markReady, snapshot };
}
