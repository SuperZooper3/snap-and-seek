"use client";

import Image from "next/image";
import { useState, useCallback, useRef, useEffect } from "react";

const TRAY_COLLAPSED_PX = 56;

function getExpandedHeightPx(): number {
  if (typeof window === "undefined") return 400;
  const h = window.visualViewport?.height ?? window.innerHeight;
  return Math.round(h * 0.75);
}

export type PlayerPhotoItem = {
  playerId: number;
  name: string;
  photoUrl: string | null;
};

type Props = {
  playerPhotos: PlayerPhotoItem[];
};

export function GodPhotoTray({ playerPhotos }: Props) {
  const [expandedHeightPx, setExpandedHeightPx] = useState(400);
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);
  const [trayExpanded, setTrayExpanded] = useState(false);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    setExpandedHeightPx(getExpandedHeightPx());
    const onResize = () => setExpandedHeightPx(getExpandedHeightPx());
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("resize", onResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const trayHeightPx = dragHeightPx ?? (trayExpanded ? expandedHeightPx : TRAY_COLLAPSED_PX);
  const isDragging = dragHeightPx !== null;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      didDragRef.current = false;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragStartRef.current = { y: e.clientY, height: trayHeightPx };
      setDragHeightPx(trayHeightPx);
    },
    [trayHeightPx]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (start == null) return;
    const dy = start.y - e.clientY;
    if (Math.abs(dy) > 5) didDragRef.current = true;
    const next = Math.max(TRAY_COLLAPSED_PX, Math.min(expandedHeightPx, start.height + dy));
    setDragHeightPx(next);
  }, [expandedHeightPx]);

  const handlePointerUp = useCallback(() => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (start == null) return;
    if (didDragRef.current) {
      const current = dragHeightPx ?? start.height;
      const mid = TRAY_COLLAPSED_PX + (expandedHeightPx - TRAY_COLLAPSED_PX) * 0.5;
      setTrayExpanded(current >= mid);
    }
    setDragHeightPx(null);
  }, [expandedHeightPx, dragHeightPx]);

  const handlePointerCancel = useCallback(() => {
    dragStartRef.current = null;
    setDragHeightPx(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!didDragRef.current) setTrayExpanded((prev) => !prev);
  }, []);

  if (playerPhotos.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 flex flex-col bg-zinc-800 border-t border-white/10 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)] safe-area-inset-bottom"
      style={{
        height: `${trayHeightPx}px`,
        transition: isDragging ? "none" : "height 300ms ease-out",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="shrink-0 flex flex-col items-center pt-2 pb-1 px-4 touch-manipulation cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: "none" }}
        aria-expanded={trayExpanded}
        aria-label={trayExpanded ? "Collapse photos tray" : "Expand photos tray"}
      >
        <span className="w-10 h-1 rounded-full bg-white/40" aria-hidden />
      </button>
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <p className="shrink-0 text-xs text-white/70 px-4 pb-2">Everyone&apos;s photos</p>
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden overscroll-x-contain">
          <div className="inline-flex gap-4 px-4 pb-4 h-full">
            {playerPhotos.map((p) => (
              <div
                key={p.playerId}
                className="flex flex-col shrink-0 w-[min(180px,40vw)] h-full min-h-[140px]"
              >
                <div className="rounded-lg overflow-hidden bg-zinc-700/80 flex-1 min-h-0 relative aspect-[4/3] max-h-[200px]">
                  {p.photoUrl ? (
                    <Image
                      src={p.photoUrl}
                      alt={`${p.name}'s hiding spot`}
                      fill
                      className="object-cover"
                      sizes="180px"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                      No photo
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-white mt-1.5 truncate text-center">
                  {p.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
