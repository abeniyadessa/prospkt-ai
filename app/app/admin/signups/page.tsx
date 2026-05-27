import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr";
import { listWaitlistSignups } from "@/lib/prelaunch-storage";
import { refreshSignups } from "./actions";

export const dynamic = "force-dynamic";

function formatJoined(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Detroit",
  });
}

export default async function AdminSignupsPage() {
  const result = await listWaitlistSignups(200);
  const { signups, total, mode, reason } = result;

  const modeLabel: Record<typeof mode, string> = {
    database: "Postgres",
    resend_contacts: "Resend Contacts",
    local: "Local SQLite",
    unavailable: "Unavailable",
  };

  const isUnavailable =
    mode === "unavailable" || mode === "resend_contacts";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="flex items-start justify-between gap-6 pb-8">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Admin
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Waitlist signups</h1>
            <p className="text-sm text-neutral-500">
              {total.toLocaleString()} total signup{total === 1 ? "" : "s"}
              {" · "}
              <span className="font-medium text-[#0F172A]">
                Source: {modeLabel[mode]}
              </span>
            </p>
          </div>

          <form action={refreshSignups}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-neutral-50"
            >
              <ArrowsClockwiseIcon size={16} weight="bold" />
              Refresh
            </button>
          </form>
        </header>

        {isUnavailable ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-[#0F172A]">
              Connect Neon Postgres to see signups here
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              {mode === "resend_contacts"
                ? "Signups are currently being written to Resend Contacts, which can't be listed from this dashboard. Provision Neon via the Vercel Marketplace and redeploy — full setup guide is in docs/superpowers/specs/2026-05-24-signup-pipeline-audit.md."
                : `Storage is not reachable${reason ? ` — ${reason}` : ""}. See the audit doc for setup steps.`}
            </p>
          </div>
        ) : signups.length === 0 ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-base font-semibold text-[#0F172A]">
              No signups yet
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              When someone joins the waitlist, they&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-neutral-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                <tr>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-neutral-50/60"
                  >
                    <td className="px-5 py-3 font-medium text-[#0F172A]">
                      {s.email}
                    </td>
                    <td className="px-5 py-3 text-neutral-500">{s.source}</td>
                    <td className="px-5 py-3 text-neutral-700">
                      {s.companyName ?? (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-neutral-700">
                      {s.city ?? <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-neutral-500">
                      {formatJoined(s.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
