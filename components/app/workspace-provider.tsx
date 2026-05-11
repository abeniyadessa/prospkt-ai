"use client";

import { createContext, useContext, useMemo } from "react";
import type { AppWorkspaceContext } from "@/lib/types";

const WorkspaceContext = createContext<AppWorkspaceContext | null>(null);

export function WorkspaceProvider({
  value,
  children,
}: {
  value: AppWorkspaceContext;
  children: React.ReactNode;
}) {
  const memoized = useMemo(() => value, [value]);
  return (
    <WorkspaceContext.Provider value={memoized}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceContext must be used inside WorkspaceProvider");
  }
  return context;
}
