export const DEFAULT_WORKSPACE_ID = "demo_workspace";
export const GLOBAL_DNC_WORKSPACE_ID = "global";

export type WorkspaceId = string;

export function resolveWorkspaceId(workspaceId?: string | null): WorkspaceId {
  const trimmed = workspaceId?.trim();
  return trimmed || DEFAULT_WORKSPACE_ID;
}
