import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  getAppWorkspaceContext,
  getWorkspace,
  upsertWorkspace,
  upsertWorkspaceMember,
  upsertWorkspaceUser,
} from "@/lib/database";
import type { AppWorkspaceContext, Workspace, WorkspaceUser } from "@/lib/types";

function userToWorkspaceUser(user: Awaited<ReturnType<typeof currentUser>>): WorkspaceUser {
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "unknown@example.com";
  const name =
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ??
    email;

  return {
    id: user?.id ?? "unknown",
    email,
    name,
    imageUrl: user?.imageUrl ?? null,
  };
}

export async function requireUser(): Promise<WorkspaceUser> {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in?redirect_url=/app");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return upsertWorkspaceUser(userToWorkspaceUser(user));
}

export async function getCurrentWorkspaceContext(): Promise<AppWorkspaceContext> {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in?redirect_url=/app");
  }
  const user = await requireUser();
  return getAppWorkspaceContext({
    user,
    workspaceId: session.orgId,
    workspaceName: session.orgSlug ? session.orgSlug.replace(/-/g, " ") : null,
    workspaceSlug: session.orgSlug,
    role: session.orgRole,
  });
}

export async function requireWorkspace(): Promise<Workspace> {
  const session = await auth();
  const user = await requireUser();
  if (!session.orgId) {
    redirect("/onboarding");
  }
  const workspace = upsertWorkspace({
    id: session.orgId,
    name: session.orgSlug ? session.orgSlug.replace(/-/g, " ") : "New workspace",
    slug: session.orgSlug,
    ownerUserId: user.id,
    role: session.orgRole,
  });
  upsertWorkspaceMember(workspace.id, user.id, session.orgRole ?? "member");
  return workspace;
}

export async function requireWorkspaceForApi(): Promise<Workspace> {
  const session = await auth();
  if (!session.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  if (!session.orgId) {
    throw new Response("Workspace required", { status: 428 });
  }
  const user = await requireUser();
  const workspace = upsertWorkspace({
    id: session.orgId,
    name: session.orgSlug ? session.orgSlug.replace(/-/g, " ") : "New workspace",
    slug: session.orgSlug,
    ownerUserId: user.id,
    role: session.orgRole,
  });
  return getWorkspace(workspace.id, session.orgRole) ?? workspace;
}

export async function requireWorkspaceRole(roles: readonly string[]): Promise<Workspace> {
  const session = await auth();
  const workspace = await requireWorkspaceForApi();
  const role = session.orgRole ?? workspace.role ?? "member";
  const normalized = role.replace(/^org:/, "");
  if (!roles.includes(role) && !roles.includes(normalized)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return workspace;
}

const INTERNAL_ERROR_PATTERNS = [
  /no such (column|table)/i,
  /sqlite/i,
  /SQL(?:ITE)?_/i,
  /constraint failed/i,
  /\bUNIQUE\b/,
  /\bNOT NULL\b/,
  /ECONNREFUSED|ENOTFOUND|EAI_AGAIN/,
];

export function apiError(error: unknown) {
  if (error instanceof Response) {
    return new NextResponse(error.body, { status: error.status });
  }
  const raw = error instanceof Error ? error.message : "Unknown error";
  const isInternal = INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(raw));
  if (isInternal) {
    console.error("[apiError] internal failure:", raw, error);
    return NextResponse.json(
      {
        error:
          "Something on our end didn't save. Try again in a moment — if it keeps happening, refresh the page.",
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ error: raw }, { status: 500 });
}
