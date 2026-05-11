import type { CampaignLane } from "@/lib/types";

export type CampaignPlaybookId =
  | "missed-call-recovery"
  | "estimate-follow-up"
  | "new-customer-outreach"
  | "past-customer-reactivation"
  | "booking-confirmation"
  | "review-follow-up";

export interface CampaignPlaybook {
  id: CampaignPlaybookId;
  lane: CampaignLane;
  title: string;
  description: string;
  defaultSource: string;
  complianceMode: string;
  goal: string;
  status: "ready" | "guarded" | "setup";
}

export const campaignPlaybooks: CampaignPlaybook[] = [
  {
    id: "missed-call-recovery",
    lane: "warm_recovery",
    title: "Missed call recovery",
    description: "Call back missed calls and form fills before the customer books someone else.",
    defaultSource: "Missed call / form lead",
    complianceMode: "Warm lead, DNC + local-hour checks",
    goal: "Book the job or schedule an estimate",
    status: "ready",
  },
  {
    id: "estimate-follow-up",
    lane: "warm_recovery",
    title: "Estimate follow-up",
    description: "Follow up on unsold quotes, old estimates, and open opportunities.",
    defaultSource: "Open estimate",
    complianceMode: "Known contact, source note required",
    goal: "Revive the deal and capture the next step",
    status: "ready",
  },
  {
    id: "new-customer-outreach",
    lane: "cold_b2b",
    title: "New customer outreach",
    description: "Prospect commercial accounts, property managers, and local business buyers.",
    defaultSource: "Business list",
    complianceMode: "B2B source, DNC + disclosure",
    goal: "Qualify need and book a discovery call",
    status: "guarded",
  },
  {
    id: "past-customer-reactivation",
    lane: "warm_recovery",
    title: "Past customer reactivation",
    description: "Bring back old customers for seasonal service, maintenance, or repeat work.",
    defaultSource: "Past customer list",
    complianceMode: "Existing relationship, opt-out honored",
    goal: "Book a repeat service call",
    status: "ready",
  },
  {
    id: "booking-confirmation",
    lane: "warm_recovery",
    title: "Booking confirmation",
    description: "Confirm appointment details and write the outcome back to the CRM.",
    defaultSource: "Booked appointment",
    complianceMode: "Transactional follow-up only",
    goal: "Reduce no-shows and confirm readiness",
    status: "setup",
  },
  {
    id: "review-follow-up",
    lane: "warm_recovery",
    title: "Review follow-up",
    description: "Reach customers after completed jobs and route happy customers to review requests.",
    defaultSource: "Completed job",
    complianceMode: "Post-service follow-up, SMS opt-in only",
    goal: "Capture reviews and future referrals",
    status: "setup",
  },
];

export const campaignLaneSummaries: Record<
  CampaignLane,
  { title: string; description: string; guardrail: string }
> = {
  warm_recovery: {
    title: "Warm recovery",
    description: "Missed calls, forms, estimates, and past customers.",
    guardrail: "Source note required, DNC enforced, conservative retry limits.",
  },
  cold_b2b: {
    title: "Cold B2B",
    description: "Commercial accounts, property managers, and local business buyers.",
    guardrail: "Business source, AI disclosure, local-hour checks, daily caps.",
  },
  cold_consumer: {
    title: "Cold consumer",
    description: "Consumer outreach for service demand generation.",
    guardrail: "Locked by default: consent/source proof, DNC, disclosure, and owner acknowledgement.",
  },
};
