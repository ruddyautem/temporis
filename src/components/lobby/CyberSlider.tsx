"use client";

import { useRef, useState, useCallback } from "react";
import { TTL_OPTIONS, type RoomTtlMinutes } from "@/lib/room-config";

interface CyberSliderProps {
  ttl: RoomTtlMinutes;
  onChange: (ttl: RoomTtlMinutes) => void;
  trackHeightClass?: string;
  minutesLabel?: string;
}

export default function CyberSlider({
  ttl,
  onChange,
  trackHeightClass = "h-8",
  minutesLabel = "min",
}: CyberSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragFraction, setDragFraction] = useState<number | null>(null);

  const selectedIndex = TTL_OPTIONS.indexOf(ttl);
  const selectedFraction = selectedIndex >= 0 ? selectedIndex / (TTL_OPTIONS.length - 1) : 0.5;

  const currentFraction = isDragging && dragFraction !== null ? dragFraction : selectedFraction;

  const calculateFractionFromClientX = useCallback((clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const usableWidth = rect.width - 20;
    if (usableWidth <= 0) return 0;
    const offsetX = clientX - rect.left - 10;
    const clamped = Math.max(0, Math.min(usableWidth, offsetX));
    return clamped / usableWidth;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const fraction = calculateFractionFromClientX(e.clientX);
    setDragFraction(fraction);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const fraction = calculateFractionFromClientX(e.clientX);
    setDragFraction(fraction);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already released
    }
    const finalFraction = calculateFractionFromClientX(e.clientX);
    const nearestIdx = Math.round(finalFraction * (TTL_OPTIONS.length - 1));
    const targetTtl = TTL_OPTIONS[nearestIdx] ?? 15;

    // Instant magnetic snap
    setDragFraction(null);
    setIsDragging(false);
    onChange(targetTtl);
  };

  const handlePointerCancel = () => {
    setDragFraction(null);
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.max(0, selectedIndex - 1);
      onChange(TTL_OPTIONS[nextIdx]);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = Math.min(TTL_OPTIONS.length - 1, selectedIndex + 1);
      onChange(TTL_OPTIONS[nextIdx]);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Time-to-live slider"
      aria-valuemin={TTL_OPTIONS[0]}
      aria-valuemax={TTL_OPTIONS[TTL_OPTIONS.length - 1]}
      aria-valuenow={ttl}
      tabIndex={0}
      className={`relative flex items-center select-none touch-none cursor-grab active:cursor-grabbing outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 ${trackHeightClass}`}
    >
      {/* Track background */}
      <div className="absolute left-2.5 right-2.5 h-1.5 bg-slate-900 border border-slate-700/80 pointer-events-none" />

      {/* Progress fill */}
      <div
        className="absolute left-2.5 h-1.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] pointer-events-none"
        style={{
          width: `calc(${currentFraction * 100}% - ${currentFraction * 20}px)`,
          transition: isDragging ? "none" : "all 150ms ease-out",
        }}
      />

      {/* Checkpoint Markers */}
      <div className="absolute inset-x-0 flex justify-between items-center z-10 pointer-events-none">
        {TTL_OPTIONS.map((minutes, idx) => {
          const markerFraction = idx / (TTL_OPTIONS.length - 1);
          const isReached = markerFraction <= currentFraction + 0.05;

          return (
            <div
              key={minutes}
              title={`${minutes} ${minutesLabel}`}
              className={`w-5 h-5 rounded-none p-0 flex items-center justify-center pointer-events-none transition-colors duration-150 ${
                isReached
                  ? "bg-emerald-400 border-2 border-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  : "bg-slate-800 border border-slate-600"
              }`}
            />
          );
        })}
      </div>

      {/* Moving Square Thumb */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-none bg-emerald-400 border-2 border-white z-20 pointer-events-none shadow-[0_0_12px_rgba(16,185,129,0.9)] ${
          isDragging ? "scale-110" : ""
        }`}
        style={{
          left: `calc(${currentFraction * 100}% - ${currentFraction * 20}px)`,
          transition: isDragging ? "transform 0.05s ease" : "left 150ms ease-out, transform 0.05s ease",
        }}
      />
    </div>
  );
}
