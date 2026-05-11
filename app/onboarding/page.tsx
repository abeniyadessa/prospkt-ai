import { OrganizationList } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
import { OnboardingForm } from "@/components/app/onboarding-form";
import { getCurrentWorkspaceContext } from "@/lib/auth";

export default async function OnboardingPage() {
  const context = await getCurrentWorkspaceContext();

  if (context.workspace?.onboardingCompleted) {
    redirect("/app");
  }

  return (
    <main className="min-h-dvh bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[980px]">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-lg bg-foreground text-white"
              aria-hidden
            >
              <LightningIcon size={16} weight="fill" />
            </span>
            <span className="text-[15px] font-semibold text-foreground">Prospkt</span>
          </Link>
          <p className="hidden text-[13px] text-muted-foreground sm:block">
            Guarded setup before the agent can call.
          </p>
        </header>

        {!context.workspace ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
            <div className="pt-6">
              <p className="text-[13px] font-medium text-muted-foreground">
                First, create your workspace
              </p>
              <h1 className="mt-3 max-w-xl text-balance text-[40px] font-semibold leading-tight text-foreground">
                Give Prospkt a team context before CRM data gets created.
              </h1>
              <p className="mt-4 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
                Workspaces isolate CRM records, DNC records, scripts, agent budgets, and
                teammates. Create one for your company or pick an invited workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-hairline bg-surface p-2 shadow-lg shadow-black/[0.04]">
              <OrganizationList
                hidePersonal
                afterCreateOrganizationUrl="/onboarding"
                afterSelectOrganizationUrl="/onboarding"
              />
            </div>
          </section>
        ) : (
          <OnboardingForm context={context} />
        )}
      </div>
    </main>
  );
}
