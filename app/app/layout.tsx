import { redirect } from "next/navigation";
import { WorkspaceProvider } from "@/components/app/workspace-provider";
import { getCurrentWorkspaceContext } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentWorkspaceContext();

  if (!context.workspace || !context.workspace.onboardingCompleted) {
    redirect("/onboarding");
  }

  return <WorkspaceProvider value={context}>{children}</WorkspaceProvider>;
}
