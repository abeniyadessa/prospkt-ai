import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: "var(--canvas)",
        fontFamily: "'Switzer', sans-serif",
      }}
    >
      {children}
    </div>
  );
}
