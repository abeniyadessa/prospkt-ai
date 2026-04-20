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
export async function getAvailableSlots(days = 7): Promise<AvailableSlot[]> {
  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;
  if (!eventTypeId) throw new Error("CALCOM_EVENT_TYPE_ID is not set");

  const startTime = new Date();
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + days);

  const params = new URLSearchParams({
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    eventTypeId,
  });

  const res = await fetch(`${CAL_API}/slots/available?${params}`, {
    headers: calHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com slots error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    status: string;
    data: { slots: Record<string, { time: string }[]> };
  };

  // Flatten the date-keyed slot map into a flat array
  const slots: AvailableSlot[] = [];
  for (const daySlots of Object.values(data.data?.slots ?? {})) {
    for (const slot of daySlots) {
      const start = new Date(slot.time);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }

  return slots;
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
