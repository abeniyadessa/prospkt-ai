// Cal.com v2 API integration
// Docs: https://cal.com/docs/api-reference/v2

const CAL_API = "https://api.cal.com/v2";
const CAL_VERSION = "2024-08-13";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvailableSlot {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

export interface BookingRequest {
  name: string;
  email: string;
  phone?: string;
  start: string; // ISO 8601
  notes?: string;
  timeZone?: string;
}

export interface Booking {
  id: number;
  uid: string;
  title: string;
  start: string;
  end: string;
  status: string;
  attendees: { name: string; email: string }[];
}

function calHeaders() {
  return {
    Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
    "cal-api-version": CAL_VERSION,
    "Content-Type": "application/json",
  };
}

// ─── Check availability ───────────────────────────────────────────────────────

/**
 * Returns available slots for the next `days` days (default: 7).
 * The Vapi assistant calls this to tell the lead what times are open.
 */
export async function getAvailableSlots(
  days = 7,
  options: { timeZone?: string } = {}
): Promise<AvailableSlot[]> {
  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;
  if (!eventTypeId) throw new Error("CALCOM_EVENT_TYPE_ID is not set");

  const startTime = new Date();
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + days);

  const params = new URLSearchParams({
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    eventTypeId,
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
  });

  const res = await fetch(`${CAL_API}/slots?${params}`, {
    headers: calHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com slots error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    status: string;
    data:
      | { slots: Record<string, { time: string; end?: string }[]> }
      | Record<string, { start: string; end?: string }[]>;
  };

  // Cal.com v2 returns either { data: { slots: {...} } } or { data: { "2026-05-04": [...] } }
  // depending on the endpoint version. Normalize both shapes.
  const slotMap: Record<string, { time?: string; start?: string; end?: string }[]> =
    data.data && typeof data.data === "object" && "slots" in data.data
      ? (data.data.slots as Record<string, { time: string; end?: string }[]>)
      : (data.data as Record<string, { start: string; end?: string }[]>);

  const slots: AvailableSlot[] = [];
  for (const daySlots of Object.values(slotMap ?? {})) {
    for (const slot of daySlots) {
      const startIso = slot.time ?? slot.start;
      if (!startIso) continue;
      const start = new Date(startIso);
      // Use API-returned end if available; only fall back to +30min if missing.
      const end = slot.end ? new Date(slot.end) : new Date(start.getTime() + 30 * 60 * 1000);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }

  return slots;
}

/**
 * Picks a spread of slots — morning + afternoon today, then up to N days out —
 * so the agent can offer real choice instead of dumping the first five
 * consecutive slots on day 1.
 */
export function spreadSlots(slots: AvailableSlot[], maxPerDay = 2, totalCap = 6): AvailableSlot[] {
  const byDay = new Map<string, AvailableSlot[]>();
  for (const slot of slots) {
    const day = slot.start.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(slot);
    byDay.set(day, list);
  }
  const out: AvailableSlot[] = [];
  for (const list of byDay.values()) {
    if (list.length === 0) continue;
    out.push(list[0]);
    if (list.length > 1 && maxPerDay > 1) {
      // Pick a slot in the afternoon if possible; otherwise the last slot of the day.
      const afternoon = list.find((s) => new Date(s.start).getHours() >= 13);
      out.push(afternoon ?? list[list.length - 1]);
    }
    if (out.length >= totalCap) break;
  }
  return out.slice(0, totalCap);
}

// ─── Book a slot ──────────────────────────────────────────────────────────────

/**
 * Books a discovery call on behalf of a lead.
 * Called by the Vapi webhook after the lead confirms a time.
 */
export async function bookSlot(request: BookingRequest): Promise<Booking> {
  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;
  if (!eventTypeId) throw new Error("CALCOM_EVENT_TYPE_ID is not set");

  const body = {
    eventTypeId: Number(eventTypeId),
    start: request.start,
    attendee: {
      name: request.name,
      email: request.email,
      timeZone: request.timeZone ?? "America/Detroit",
    },
    metadata: {
      phone: request.phone ?? "",
      source: "prospkt-ai",
    },
    ...(request.notes ? { responses: { notes: request.notes } } : {}),
  };

  const res = await fetch(`${CAL_API}/bookings`, {
    method: "POST",
    headers: calHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com booking error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { status: string; data: Booking };
  return data.data;
}

// ─── Cancel a booking ─────────────────────────────────────────────────────────

export async function cancelBooking(bookingUid: string, reason?: string): Promise<void> {
  const res = await fetch(`${CAL_API}/bookings/${bookingUid}/cancel`, {
    method: "POST",
    headers: calHeaders(),
    body: JSON.stringify({ reason: reason ?? "Cancelled via Prospkt" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com cancel error ${res.status}: ${text}`);
  }
}
