"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwiseIcon,
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  EnvelopeIcon,
  ListChecksIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { CalBooking } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  EmptyState,
  GhostButton,
  LoadingState,
  PageHeader,
} from "@/components/app/primitives";
import { CalcomDiagnostics } from "@/components/app/calcom-diagnostics";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDayKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDayKey(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCompactDay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isToday(date: Date) {
  const now = new Date();
  return toDayKey(date) === toDayKey(now);
}

function isTomorrow(date: Date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDayKey(date) === toDayKey(tomorrow);
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getCalendarCells(month: Date) {
  const first = startOfMonth(month);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const offset = first.getDay();

  return Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    if (day < 1 || day > daysInMonth) return null;
    return new Date(first.getFullYear(), first.getMonth(), day);
  });
}

function getAttendee(booking: CalBooking) {
  return booking.attendees?.[0];
}

function getBookingName(booking: CalBooking) {
  return getAttendee(booking)?.name ?? booking.title ?? "Discovery call";
}

function getBookingType(booking: CalBooking) {
  const attendeeName = getAttendee(booking)?.name;
  if (booking.title && booking.title !== attendeeName) return booking.title;
  return "Discovery call";
}

function formatTimeRange(booking: CalBooking) {
  const attendee = getAttendee(booking);
  const timeZone = attendee?.timeZone ?? "America/Detroit";
  const start = new Date(booking.start);
  const end = new Date(booking.end);
  return `${start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  })} - ${end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  })}`;
}

export function AppointmentsView() {
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments");
      const data = (await res.json()) as {
        appointments?: CalBooking[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to load appointments");
      }
      setBookings(data.appointments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load appointments");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedBookings = useMemo(
    () =>
      bookings
        .slice()
        .sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        ),
    [bookings]
  );

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, CalBooking[]>();
    for (const booking of sortedBookings) {
      const key = toDayKey(new Date(booking.start));
      const list = map.get(key) ?? [];
      list.push(booking);
      map.set(key, list);
    }
    return map;
  }, [sortedBookings]);

  useEffect(() => {
    if (selectedDayKey !== null) return;
    const firstBooking = sortedBookings[0];
    if (firstBooking) {
      const date = new Date(firstBooking.start);
      setSelectedDayKey(toDayKey(date));
      setVisibleMonth(startOfMonth(date));
      return;
    }
    setSelectedDayKey(toDayKey(new Date()));
  }, [selectedDayKey, sortedBookings]);

  const grouped = useMemo(() => {
    const map = new Map<string, CalBooking[]>();
    for (const booking of sortedBookings) {
      const date = new Date(booking.start);
      const key = formatDayKey(date);
      const list = map.get(key) ?? [];
      list.push(booking);
      map.set(key, list);
    }

    return Array.from(map.entries()).map(([label, list]) => {
      const first = new Date(list[0].start);
      const suffix = isToday(first) ? "Today" : isTomorrow(first) ? "Tomorrow" : null;
      return { label, suffix, bookings: list };
    });
  }, [sortedBookings]);

  const calendarCells = useMemo(() => getCalendarCells(visibleMonth), [visibleMonth]);
  const selectedDate = selectedDayKey ? fromDayKey(selectedDayKey) : new Date();
  const selectedBookings = selectedDayKey ? bookingsByDay.get(selectedDayKey) ?? [] : [];
  const monthBookingCount = sortedBookings.filter((booking) =>
    isSameMonth(new Date(booking.start), visibleMonth)
  ).length;

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* no-op */
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description={`${bookings.length} upcoming booked ${
          bookings.length === 1 ? "call" : "calls"
        } synced from Cal.com into the service-sales handoff flow`}
        actions={
          <GhostButton
            onClick={load}
            loading={loading}
            iconLeft={<ArrowClockwiseIcon size={12} />}
          >
            Refresh
          </GhostButton>
        }
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-[color:var(--danger)]/20 bg-[#FAE3E0] px-4 py-3 text-[13px] text-[#A32A22]">
          <WarningCircleIcon size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      <CalcomDiagnostics />

      <Card className="shadow-sm shadow-black/[0.02]">
        <div className="flex h-9 items-center justify-between gap-3 border-b border-hairline px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
              <span className="size-2 rounded-full bg-[#E3E3E1]" />
              <span className="size-2 rounded-full bg-[#E3E3E1]" />
              <span className="size-2 rounded-full bg-[#E3E3E1]" />
            </div>
            <p className="truncate text-[11.5px] font-medium text-muted-foreground">
              Bookings and CRM sync
            </p>
          </div>
          <div className="hidden items-center gap-2 text-[11.5px] text-muted-foreground sm:flex">
            <CalendarCheckIcon size={12} aria-hidden />
            <span className="tabular-nums">{monthBookingCount} this month</span>
          </div>
        </div>

        {loading && bookings.length === 0 ? (
          <LoadingState label="Loading appointments..." />
        ) : (
          <div className="grid gap-px bg-[color:var(--hairline)] lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="bg-surface p-4 md:p-5" aria-label="Appointment calendar">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {visibleMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    Select a booked day to inspect the handoff.
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[color:var(--elevated)] hover:text-foreground"
                    aria-label="Previous month"
                  >
                    <CaretLeftIcon size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[color:var(--elevated)] hover:text-foreground"
                    aria-label="Next month"
                  >
                    <CaretRightIcon size={14} aria-hidden />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5" role="grid">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="pb-1 text-center text-[10.5px] font-medium text-muted-foreground"
                    role="columnheader"
                  >
                    {day}
                  </div>
                ))}

                {calendarCells.map((date, index) => {
                  if (!date) {
                    return (
                      <span
                        key={`blank-${index}`}
                        className="aspect-square rounded-lg border border-transparent"
                        aria-hidden
                      />
                    );
                  }

                  const key = toDayKey(date);
                  const dayBookings = bookingsByDay.get(key) ?? [];
                  const selected = key === selectedDayKey;
                  const hasBookings = dayBookings.length > 0;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDayKey(key)}
                      className={cn(
                        "relative flex aspect-square min-h-14 flex-col items-start justify-between rounded-lg border p-2 text-left transition-colors",
                        selected
                          ? "border-[#2E7D4F] bg-[#E8F3EC]"
                          : hasBookings
                          ? "border-[#A8D3B9] bg-[#F2FAF5] hover:bg-[#E8F3EC]"
                          : "border-hairline bg-[color:var(--elevated)] hover:bg-surface"
                      )}
                      aria-pressed={selected}
                      aria-label={`${formatCompactDay(date)}, ${dayBookings.length} ${
                        dayBookings.length === 1 ? "booking" : "bookings"
                      }`}
                    >
                      <span
                        className={cn(
                          "text-[11px] font-medium tabular-nums",
                          selected || hasBookings ? "text-[#2E7D4F]" : "text-muted-foreground"
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {hasBookings && (
                        <span className="flex items-center gap-1 self-end">
                          <span className="size-1.5 rounded-full bg-[#2E7D4F]" />
                          <span className="text-[10px] font-medium text-[#2E7D4F] tabular-nums">
                            {dayBookings.length}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-surface p-4 md:p-5" aria-label="Selected booking handoff">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {formatCompactDay(selectedDate)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {selectedBookings.length > 0
                      ? `${selectedBookings.length} handoff ${
                          selectedBookings.length === 1 ? "ready" : "ready"
                        }`
                      : "No bookings selected"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EC] px-2 py-1 text-[11px] font-medium text-[#2E7D4F]">
                  <ListChecksIcon size={12} aria-hidden />
                  CRM sync
                </span>
              </div>

              {selectedBookings.length === 0 ? (
                <EmptyState
                  icon={CalendarBlankIcon}
                  title="No calls on this day"
                  description="Booked calls will appear here with their Cal.com record and follow-up checklist."
                  compact
                />
              ) : (
                <div className="space-y-3">
                  {selectedBookings.map((booking) => (
                    <BookingHandoffCard
                      key={booking.uid}
                      booking={booking}
                      copied={copied}
                      onCopyEmail={copyEmail}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Upcoming handoffs"
          description="Each booked call carries the Cal.com event plus the follow-up workflow."
          count={bookings.length}
        />
        {loading && bookings.length === 0 ? (
          <LoadingState label="Loading upcoming calls..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CalendarCheckIcon}
            title="No upcoming appointments"
            description="Bookings will appear here after a successful call. Make sure your Cal.com event type is set up."
          />
        ) : (
          <div className="divide-y divide-hairline">
            {grouped.map((group) => (
              <section key={group.label}>
                <div className="flex items-baseline gap-2 bg-[color:var(--elevated)] px-5 py-2">
                  <h2 className="text-[12px] font-semibold text-foreground">
                    {group.suffix ?? group.label}
                  </h2>
                  {group.suffix && (
                    <span className="text-[11.5px] text-muted-foreground">
                      {group.label}
                    </span>
                  )}
                </div>
                <ul className="divide-y divide-hairline">
                  {group.bookings.map((booking) => (
                    <BookingListItem
                      key={booking.uid}
                      booking={booking}
                      copied={copied}
                      onCopyEmail={copyEmail}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function BookingHandoffCard({
  booking,
  copied,
  onCopyEmail,
}: {
  booking: CalBooking;
  copied: string | null;
  onCopyEmail: (email: string) => void;
}) {
  const attendee = getAttendee(booking);
  const email = attendee?.email;
  const handoffs = [
    { label: "Cal.com event", detail: booking.uid, state: "Synced" },
    { label: "SMS confirmation", detail: "Twilio follow-up workflow", state: "Ready" },
    { label: "Call activity", detail: "Logged to lead drawer + transcript", state: "Ready" },
    { label: "Email digest", detail: "Owner notification workflow", state: "Ready" },
  ];

  return (
    <article className="rounded-xl border border-hairline bg-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">
            {getBookingName(booking)}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-muted-foreground">
            <ClockIcon size={11} aria-hidden />
            <span className="tabular-nums">{formatTimeRange(booking)}</span>
            <span>/</span>
            <span className="truncate">{getBookingType(booking)}</span>
          </p>
        </div>
        <a
          href={`https://cal.com/booking/${booking.uid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[color:var(--elevated)] hover:text-foreground"
          aria-label="Open booking in Cal.com"
          title="Open in Cal.com"
        >
          <ArrowSquareOutIcon size={13} aria-hidden />
        </a>
      </div>

      {email && (
        <button
          type="button"
          onClick={() => onCopyEmail(email)}
          className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-md bg-[color:var(--elevated)] px-2.5 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Copy ${email}`}
        >
          <EnvelopeIcon size={12} aria-hidden />
          <span className="truncate">{email}</span>
          {copied === email ? (
            <CheckIcon size={11} color="#2E7D4F" aria-hidden />
          ) : (
            <CopyIcon size={11} aria-hidden />
          )}
        </button>
      )}

      <div className="mt-3 space-y-1.5">
        {handoffs.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-hairline px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-medium text-foreground">
                {item.label}
              </p>
              <p className="truncate text-[10.5px] text-muted-foreground">
                {item.detail}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#E8F3EC] px-1.5 py-0.5 text-[10.5px] font-medium text-[#2E7D4F]">
              <CheckIcon size={10} weight="bold" aria-hidden />
              {item.state}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function BookingListItem({
  booking,
  copied,
  onCopyEmail,
}: {
  booking: CalBooking;
  copied: string | null;
  onCopyEmail: (email: string) => void;
}) {
  const start = new Date(booking.start);
  const attendee = getAttendee(booking);
  const email = attendee?.email;

  return (
    <li className="flex items-center gap-4 px-5 py-3.5 row-hover transition-colors">
      <div
        className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-hairline"
        style={{ backgroundColor: "var(--elevated)" }}
        aria-hidden
      >
        <p className="text-[9px] font-semibold uppercase text-muted-foreground">
          {start.toLocaleDateString("en-US", { month: "short" })}
        </p>
        <p className="text-[17px] font-semibold leading-none text-foreground tabular-nums">
          {start.getDate()}
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-foreground">
          {getBookingName(booking)}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <ClockIcon size={10} aria-hidden />
            {formatTimeRange(booking)}
          </span>
          <span className="truncate max-w-[16rem]">{getBookingType(booking)}</span>
          {email && (
            <button
              type="button"
              onClick={() => onCopyEmail(email)}
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              aria-label={`Copy ${email}`}
            >
              <EnvelopeIcon size={10} aria-hidden />
              <span className="max-w-[14rem] truncate">{email}</span>
              {copied === email ? (
                <CheckIcon size={10} color="#2E7D4F" aria-hidden />
              ) : (
                <CopyIcon size={10} aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>

      <span
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize"
        style={{
          backgroundColor:
            booking.status === "accepted" ? "rgba(46,125,79,0.1)" : "var(--muted)",
          color: booking.status === "accepted" ? "#2E7D4F" : "#6B6B6B",
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{
            backgroundColor: booking.status === "accepted" ? "#2E7D4F" : "#9F9F9E",
          }}
          aria-hidden
        />
        {booking.status}
      </span>

      <a
        href={`https://cal.com/booking/${booking.uid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[color:var(--elevated)] hover:text-foreground"
        aria-label="Open booking in Cal.com"
        title="Open in Cal.com"
      >
        <ArrowSquareOutIcon size={13} aria-hidden />
      </a>
    </li>
  );
}
