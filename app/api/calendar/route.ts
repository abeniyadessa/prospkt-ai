import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { getAvailableSlots, bookSlot, type BookingRequest } from "@/lib/calendar";

// GET /api/calendar?days=7
// Returns available slots for the next N days
export async function GET(request: NextRequest) {
  const days = Number(request.nextUrl.searchParams.get("days") ?? "7");

  try {
    await requireWorkspaceForApi();
    const slots = await getAvailableSlots(days);
    return NextResponse.json({ slots });
  } catch (err) {
    return apiError(err);
  }
}

// POST /api/calendar
// Body: BookingRequest — books a discovery call
export async function POST(request: NextRequest) {
  try {
    await requireWorkspaceForApi();
  } catch (error) {
    return apiError(error);
  }

  let body: BookingRequest;
  try {
    body = (await request.json()) as BookingRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || !body.email || !body.start) {
    return NextResponse.json(
      { error: "Missing required fields: name, email, start" },
      { status: 400 }
    );
  }

  try {
    const booking = await bookSlot(body);
    return NextResponse.json({ booking });
  } catch (err) {
    return apiError(err);
  }
}
