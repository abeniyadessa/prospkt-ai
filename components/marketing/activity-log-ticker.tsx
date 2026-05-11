"use client";

import { useEffect, useRef, useState } from "react";

export type ActivityEvent = [time: string, message: string, detail: string];

export function ActivityLogTicker({ slots }: { slots: ActivityEvent[][] }) {
  const [tick, setTick] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const interval = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [isVisible]);

  return (
    <div ref={rootRef} className="space-y-1.5">
      {slots.map((slot, slotIndex) => {
        const event = slot[(tick + slotIndex) % slot.length];
        const [time, message, detail] = event;

        return (
          <div
            key={`activity-slot-${slotIndex}`}
            className="relative h-9 overflow-hidden rounded-lg bg-[color:var(--elevated)]"
          >
            <div
              key={`${slotIndex}-${tick}-${time}`}
              className="agent-log-entry grid h-9 grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2 px-2.5"
            >
              <span className="text-[10px] tabular-nums text-muted-foreground">{time}</span>
              <span className="truncate text-[11.5px] text-muted-foreground">
                {message}
              </span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">
                {detail}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
