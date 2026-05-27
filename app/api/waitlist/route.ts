import { NextResponse } from "next/server";
import { z } from "zod";
import {
  sendWaitlistConfirmation,
  sendWaitlistSignupNotification,
} from "@/lib/email";
import {
  createWaitlistSignupRecord,
  waitlistStorageMode,
} from "@/lib/prelaunch-storage";

export const runtime = "nodejs";

const waitlistSchema = z.object({
  email: z.email("Enter a valid email."),
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const payload = waitlistSchema.parse(await request.json());
    const signupInput = {
      email: payload.email,
      companyName: payload.companyName || null,
      city: payload.city || null,
      source: payload.source || "prelaunch",
    };
    let storageError: unknown;
    const signup = await createWaitlistSignupRecord(signupInput).catch((error) => {
      storageError = error;
      return null;
    });

    const [notification, confirmation] = await Promise.all([
      sendWaitlistSignupNotification({
        ...signupInput,
        storageMode: signup ? waitlistStorageMode() : "email_only",
      }),
      sendWaitlistConfirmation({ email: signupInput.email }),
    ]);

    if (!signup && !notification.sent) {
      throw storageError instanceof Error
        ? storageError
        : new Error("Could not save waitlist signup.");
    }

    return NextResponse.json({
      ok: true,
      signup,
      storage: signup ? waitlistStorageMode() : "email_only",
      confirmationSent: confirmation.sent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Check the form and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Something went sideways. Try again in a moment." },
      { status: 500 }
    );
  }
}
