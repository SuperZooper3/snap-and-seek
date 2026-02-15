"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraState =
  | { status: "idle" }
  | { status: "loading"; attempt?: number }
  | { status: "streaming" }
  | { status: "error"; message: string };

type CameraCaptureProps = {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
  /** When true, start the camera automatically on mount (skips the "Open Camera" button). */
  autoStart?: boolean;
  /** When true, remove max-width constraint so the viewfinder fills its parent container. */
  fullScreen?: boolean;
};

export function CameraCapture({
  onCapture,
  disabled,
  autoStart = false,
  fullScreen = false,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>({
    status: "idle",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const MAX_CAMERA_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  const startCamera = useCallback(async () => {
    setCameraState({ status: "loading" });
    setPreviewUrl(null);
    setCapturedBlob(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraState({
        status: "error",
        message: "Camera is not supported by your browser.",
      });
      return;
    }

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= MAX_CAMERA_RETRIES; attempt++) {
      setCameraState(
        attempt === 1
          ? { status: "loading" }
          : { status: "loading", attempt }
      );
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraState({ status: "streaming" });
        return;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_CAMERA_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }

    let message = "Failed to access camera.";
    if (lastError instanceof DOMException) {
      if (lastError.name === "NotAllowedError") {
        message =
          "Camera permission denied. Allow camera access to take photos.";
      } else if (lastError.name === "NotFoundError") {
        message = "No camera found on this device.";
      } else if (lastError.name === "NotReadableError") {
        message = "Camera is already in use by another application.";
      }
    }
    setCameraState({ status: "error", message });
  }, []);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopStream();
        setCameraState({ status: "idle" });
      },
      "image/jpeg",
      0.9
    );
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedBlob(null);
    startCamera();
  }, [previewUrl, startCamera]);

  const handleUsePhoto = useCallback(() => {
    if (capturedBlob) {
      onCapture(capturedBlob);
    }
  }, [capturedBlob, onCapture]);

  // Auto-start camera on mount if requested
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isVideoVisible =
    cameraState.status === "loading" || cameraState.status === "streaming";

  const viewfinderClass = fullScreen
    ? "relative w-full flex items-center justify-center"
    : "relative w-full max-w-md mx-auto";

  // In fullScreen mode, cap the video/preview height so the controls
  // (shutter, retake/use) always remain visible below the viewfinder.
  const mediaClass = fullScreen
    ? "max-h-[65vh] w-auto max-w-full object-contain bg-black"
    : "w-full rounded-lg border border-amber-200 dark:border-zinc-600 bg-black";

  return (
    <div className={fullScreen ? "flex flex-col h-full" : "space-y-4"}>
      {/* Viewfinder / Preview area */}
      <div className={`${viewfinderClass} ${fullScreen ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
        {/*
          Single video element always mounted while loading or streaming so the
          ref stays stable and srcObject is never lost on re-render.
        */}
        {isVideoVisible && (
          <div className={`relative ${fullScreen ? "flex items-center justify-center h-full" : ""}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`${mediaClass} ${
                cameraState.status === "loading" ? "invisible" : ""
              }`}
            />
            {/* Loading overlay shown on top of the (invisible) video */}
            {cameraState.status === "loading" && (
              <div
                className={`absolute inset-0 ${fullScreen ? "" : "rounded-lg"} bg-amber-100/80 dark:bg-zinc-700/80 flex flex-col items-center justify-center gap-1 text-amber-800 dark:text-amber-200 text-sm`}
              >
                <span>Starting camera…</span>
                {cameraState.attempt != null && cameraState.attempt > 1 && (
                  <span className="text-xs opacity-80">
                    Try {cameraState.attempt} of {MAX_CAMERA_RETRIES}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Captured photo preview */}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Captured photo"
            className={mediaClass}
          />
        )}

        {/* Idle state no camera, no preview (only shown when NOT auto-starting) */}
        {cameraState.status === "idle" && !previewUrl && !autoStart && (
          <div className="w-full aspect-[4/3] rounded-lg bg-amber-100/80 dark:bg-zinc-700/80 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm border border-amber-200 dark:border-zinc-600">
            Tap &ldquo;Open Camera&rdquo; to start
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls in fullScreen mode these are pinned at the bottom */}
      <div className={`flex flex-col items-center gap-3 ${fullScreen ? "flex-shrink-0 py-4" : ""}`}>
        {/* Error message */}
        {cameraState.status === "error" && (
          <p className="text-red-600 dark:text-red-400 text-sm text-center">
            {cameraState.message}
          </p>
        )}

        {/* Open Camera button (hidden when autoStart is used) */}
        {cameraState.status === "idle" && !previewUrl && !autoStart && (
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className="px-6 py-2.5 rounded-lg font-semibold text-white
              bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            Open Camera
          </button>
        )}

        {/* Error retry button */}
        {cameraState.status === "error" && (
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className="px-6 py-2.5 rounded-lg font-semibold text-white
              bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            Try Again
          </button>
        )}

        {/* Shutter button while streaming */}
        {cameraState.status === "streaming" && (
          <button
            type="button"
            onClick={takePhoto}
            disabled={disabled}
            className="w-16 h-16 rounded-full bg-white border-4 border-amber-500
              hover:border-amber-600 active:bg-amber-100
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors shadow-lg"
            aria-label="Take photo"
          />
        )}

        {/* Retake / Use Photo after capture */}
        {previewUrl && capturedBlob && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRetake}
              disabled={disabled}
              className="px-5 py-2.5 rounded-lg font-semibold
                text-amber-900 dark:text-amber-100
                bg-amber-100 hover:bg-amber-200 dark:bg-zinc-700 dark:hover:bg-zinc-600
                border border-amber-200 dark:border-zinc-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={handleUsePhoto}
              disabled={disabled}
              className="px-5 py-2.5 rounded-lg font-semibold text-white
                bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              Use Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
