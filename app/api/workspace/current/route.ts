import { NextResponse } from "next/server";
import { apiError, getCurrentWorkspaceContext, requireWorkspaceForApi } from "@/lib/auth";
import { updateWorkspaceSettings } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getCurrentWorkspaceContext());
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const workspace = await requireWorkspaceForApi();
    const body = (await request.json()) as {
      companyName?: string;
      timezone?: string;
      bookingEmail?: string | null;
      notificationEmail?: string | null;
      targetCities?: string[];
      targetCategories?: string[];
    };
    const settings = updateWorkspaceSettings(workspace.id, {
      companyName: body.companyName,
      timezone: body.timezone,
      bookingEmail: body.bookingEmail,
      notificationEmail: body.notificationEmail,
      targetCities: body.targetCities,
      targetCategories: body.targetCategories,
    });
    return NextResponse.json({ workspace, settings });
  } catch (error) {
    return apiError(error);
  }
}
