"use client";

import { useState } from "react";
import {
  ArrowClockwiseIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Card, GhostButton, AccentButton } from "./primitives";

interface Slot {
  start: string;
  end: string;
}

interface BookingResult {
  id?: number | string;
  uid?: string;
  start?: string;
  status?: string;
}

export function CalcomDiagnostics() {
  const [open, setOpen] = useState(false);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [days, setDays] = useState(5);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [start, setStart] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  async function fetchSlots() {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const res = await fetch(`/api/calendar?days=${days}`);
      const data = (await res.json()) as { slots?: Slot[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch slots");
      setSlots(data.slots ?? []);
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : "Failed to fetch slots");
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function placeBooking() {
    if (!name.trim() || !email.trim() || !start.trim()) {
      setBookingError("Name, email, and start time are required.");
      return;
    }
    setBookingLoading(true);
    setBookingError(null);
    setBookingResult(null);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          start: start.trim(),
          notes: "Test booking from Prospkt diagnostics",
        }),
      });
      const data = (await res.json()) as { booking?: BookingResult; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setBookingResult(data.booking ?? null);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  function pickSlot(slot: Slot) {
    setStart(slot.start);
    setBookingError(null);
    setBookingResult(null);
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          {open ? (
            <CaretDownIcon size={13} aria-hidden />
          ) : (
            <CaretRightIcon size={13} aria-hidden />
          )}
          <CalendarBlankIcon size={15} aria-hidden />
          <div>
            <p className="text-[13.5px] font-semibold text-foreground">
              Verify Cal.com integration
            </p>
            <p className="text-[11.5px] text-muted-foreground">
              Fetch real availability and place a test booking — without making a call.
            </p>
          </div>
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-hairline px-4 py-4 sm:px-5 sm:py-5">
          {/* ── Slots ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="label-caps">1. Available slots</h3>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="diag-days"
                  className="text-[11.5px] text-muted-foreground"
                >
                  Look ahead
                </label>
                <select
                  id="diag-days"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="h-7 rounded-md border border-border bg-surface px-2 text-[12px]"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                </select>
                <GhostButton
                  onClick={fetchSlots}
                  loading={slotsLoading}
                  iconLeft={<ArrowClockwiseIcon size={11} aria-hidden />}
                >
                  Fetch
                </GhostButton>
              </div>
            </div>

            {slotsError && (
              <div className="flex items-start gap-2 rounded-lg bg-[#FAE3E0] px-3 py-2.5 text-[12px] text-[#A32A22]">
                <WarningCircleIcon
                  size={13}
                  weight="fill"
                  aria-hidden
                  className="mt-px"
                />
                <span className="font-mono break-all">{slotsError}</span>
              </div>
            )}

            {slots.length > 0 ? (
              <div className="rounded-lg border border-hairline">
                <div className="max-h-56 overflow-y-auto divide-y divide-hairline">
                  {slots.slice(0, 30).map((slot) => {
                    const dt = new Date(slot.start);
                    const label = dt.toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "America/Detroit",
                    });
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => pickSlot(slot)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[color:var(--elevated)]"
                      >
                        <span className="text-[12.5px] font-medium text-foreground">
                          {label}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {slot.start}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {slots.length > 30 && (
                  <p className="border-t border-hairline px-3 py-1.5 text-[11px] text-muted-foreground">
                    Showing first 30 of {slots.length}
                  </p>
                )}
              </div>
            ) : !slotsError && !slotsLoading ? (
              <p className="text-[12px] text-muted-foreground">
                Click Fetch to load slots from Cal.com.
              </p>
            ) : null}
          </section>

          {/* ── Test booking ── */}
          <section className="space-y-3">
            <h3 className="label-caps">2. Place a test booking</h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="diag-name"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Attendee name
                </label>
                <input
                  id="diag-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Test Lead"
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="diag-email"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Attendee email
                </label>
                <input
                  id="diag-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="diag-start"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Start (ISO 8601 — pick from list above to auto-fill)
                </label>
                <input
                  id="diag-start"
                  type="text"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  placeholder="2026-05-05T14:00:00.000Z"
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 font-mono text-[12.5px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                />
              </div>
            </div>

            {bookingError && (
              <div className="flex items-start gap-2 rounded-lg bg-[#FAE3E0] px-3 py-2.5 text-[12px] text-[#A32A22]">
                <WarningCircleIcon
                  size={13}
                  weight="fill"
                  aria-hidden
                  className="mt-px"
                />
                <span className="font-mono break-all">{bookingError}</span>
              </div>
            )}

            {bookingResult && (
              <div className="flex items-start gap-2 rounded-lg bg-[#E8F3EC] px-3 py-2.5 text-[12px] text-[#2E7D4F]">
                <CheckCircleIcon
                  size={13}
                  weight="fill"
                  aria-hidden
                  className="mt-px"
                />
                <span>
                  Booked! UID:{" "}
                  <span className="font-mono">{bookingResult.uid ?? bookingResult.id}</span>
                  {bookingResult.start && (
                    <>
                      {" "}
                      at{" "}
                      <span className="font-mono">{bookingResult.start}</span>
                    </>
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <AccentButton
                onClick={placeBooking}
                loading={bookingLoading}
                disabled={!name.trim() || !email.trim() || !start.trim()}
              >
                Place test booking
              </AccentButton>
            </div>
          </section>
        </div>
      )}
    </Card>
  );
}
