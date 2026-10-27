"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { TTL_OPTIONS, type RoomTtlMinutes } from "@/lib/room-config";

export interface DurationSliderHandle {
  select: (minutes: RoomTtlMinutes) => void;
}

interface Props {
  ref?: Ref<DurationSliderHandle>;
  ttl: RoomTtlMinutes;
  onChange: (minutes: RoomTtlMinutes) => void;
  label: string;
  minutesLabel: string;
}

export default function SegmentedDurationSlider({ ref, ttl, onChange, label, minutesLabel }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const animationFrame = useRef<number | null>(null);
  const [trackWidth, setTrackWidth] = useState(500);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(([entry]) => setTrackWidth(entry.contentRect.width));
    observer.observe(track);
    return () => {
      observer.disconnect();
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, []);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const value = dragValue ?? TTL_OPTIONS.indexOf(ttl);
  const snap = (value: number) => TTL_OPTIONS[Math.max(0, Math.min(2, Math.round(value)))];

  const cancelSnap = () => {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
  };
  const animateSnap = (from: number, target = Math.max(0, Math.min(2, Math.round(from)))) => {
    cancelSnap();
    onChange(TTL_OPTIONS[target]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(from - target) < 0.001) {
      setDragValue(null);
      return;
    }
    setDragValue(from);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 250);
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      setDragValue(from + (target - from) * eased);
      if (progress < 1) animationFrame.current = requestAnimationFrame(tick);
      else { animationFrame.current = null; setDragValue(null); }
    };
    animationFrame.current = requestAnimationFrame(tick);
  };

  useImperativeHandle(ref, () => ({
    select: (minutes) => animateSnap(value, TTL_OPTIONS.indexOf(minutes)),
  }));

  const cursorX = 10 + (value / 2) * (trackWidth - 20);
  const segment = (from: number, to: number) => {
    const count = Math.max(0, Math.floor((to - from + 4) / 10));
    const offset = (to - from - (count * 10 - 4)) / 2;
    return Array.from({ length: count }, (_, index) => from + offset + index * 10);
  };
  const marks = [...segment(26, trackWidth / 2 - 16), ...segment(trackWidth / 2 + 16, trackWidth - 26)];

  return (
    <div ref={trackRef} className="session-time-slider">
      <svg className="session-time-rail" width="100%" height="24" viewBox={`0 0 ${trackWidth} 24`} aria-hidden="true">
        {marks.map(x => <rect key={x} x={x} y={9} width={6} height={6} className="session-track-square" data-active={x + 3 <= cursorX} />)}
      </svg>
      <div className="session-slider-checkpoints" aria-hidden="true">
        {TTL_OPTIONS.map((minutes, index) => <span key={minutes} data-active={index <= value} style={{ left: `calc(${index * 50}% - ${index * 10}px)` }} />)}
      </div>
      <input
        type="range"
        min={0}
        max={2}
        step={0.001}
        value={value}
        aria-label={label}
        aria-valuetext={ttl + " " + minutesLabel}
        onPointerDown={(event) => {
          cancelSnap();
          isDragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (isDragging.current) {
            setDragValue(next);
            onChange(snap(next));
          } else animateSnap(next);
        }}
        onPointerUp={(event) => {
          isDragging.current = false;
          animateSnap(Number(event.currentTarget.value));
        }}
        onPointerCancel={() => { cancelSnap(); isDragging.current = false; setDragValue(null); }}
        onLostPointerCapture={() => {
          if (isDragging.current) { isDragging.current = false; animateSnap(value); }
        }}
        onBlur={() => {
          if (isDragging.current) { isDragging.current = false; animateSnap(value); }
        }}
        onKeyDown={(event) => {
          const index = TTL_OPTIONS.indexOf(ttl);
          let next: RoomTtlMinutes;
          switch (event.key) {
            case "ArrowLeft": case "ArrowDown": next = TTL_OPTIONS[Math.max(0, index - 1)]; break;
            case "ArrowRight": case "ArrowUp": next = TTL_OPTIONS[Math.min(TTL_OPTIONS.length - 1, index + 1)]; break;
            case "Home": next = TTL_OPTIONS[0]; break;
            case "End": next = TTL_OPTIONS[TTL_OPTIONS.length - 1]; break;
            default: return;
          }
          event.preventDefault();
          animateSnap(value, TTL_OPTIONS.indexOf(next));
        }}
      />
    </div>
  );
}
