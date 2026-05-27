"use client";

import { useState } from "react";
import { HeadphonesIcon, MicrophoneIcon } from "@phosphor-icons/react";
import { PrelaunchVoiceDemo } from "@/components/marketing/prelaunch-voice-demo";
import { PrelaunchLiveDemo } from "@/components/marketing/prelaunch-live-demo";
import { cn } from "@/lib/utils";

type Mode = "live" | "sample";

export function PrelaunchDemo() {
  // Defaulting to the pre-recorded sample while the Vapi live demo is being
  // debugged in a fresh session. The "Talk to Prospkt" tab still works for
  // anyone who clicks it once the config is fixed, but no visitor lands on
  // a broken experience.
  const [mode, setMode] = useState<Mode>("sample");

  return (
    <div className="mx-auto mt-10 w-full max-w-[720px]">
      <div
        role="tablist"
        aria-label="Demo mode"
        className="mx-auto mb-4 inline-flex rounded-full border border-hairline bg-elevated p-1"
      >
        <ModeTab
          active={mode === "live"}
          onClick={() => setMode("live")}
          icon={<MicrophoneIcon size={12} weight="fill" />}
          label="Talk to Prospkt"
        />
        <ModeTab
          active={mode === "sample"}
          onClick={() => setMode("sample")}
          icon={<HeadphonesIcon size={12} weight="fill" />}
          label="Listen to a sample"
        />
      </div>

      <div className="text-left">
        {mode === "live" ? <PrelaunchLiveDemo /> : <PrelaunchVoiceDemo />}
      </div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "press inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition-colors",
        active
          ? "bg-foreground text-white shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
