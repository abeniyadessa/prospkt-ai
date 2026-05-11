import type { Lead } from "@/lib/types";

function websiteMultiplier(status: Lead["websiteStatus"]) {
  if (status === "none") return 2;
  if (status === "outdated") return 1;
  return -2;
}

function laneMultiplier(lead: Lead) {
  if (lead.campaignLane === "warm_recovery") return 4;
  if (lead.campaignLane === "cold_b2b") return 1;
  if (lead.campaignLane === "cold_consumer") return -10;
  return 0;
}

function valueMultiplier(lead: Lead) {
  const estimate = lead.estimateValueCents ?? 0;
  if (estimate >= 500_000) return 3;
  if (estimate >= 150_000) return 2;
  if (estimate > 0) return 1;
  return 0;
}

export function rankLeadsForAgent(leads: Lead[]) {
  return leads
    .filter((lead) => !["booked", "not_interested", "dnc"].includes(lead.status ?? "new"))
    .slice()
    .sort((a, b) => {
      const aScore =
        a.priorityScore + websiteMultiplier(a.websiteStatus) + laneMultiplier(a) + valueMultiplier(a);
      const bScore =
        b.priorityScore + websiteMultiplier(b.websiteStatus) + laneMultiplier(b) + valueMultiplier(b);
      return bScore - aScore;
    });
}
