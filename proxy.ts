import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/onboarding(.*)",
  "/api/analytics(.*)",
  "/api/agent/run",
  "/api/agent/status",
  "/api/agent/pause",
  "/api/agent/resume",
  "/api/agent/test-call",
  "/api/agent/vapi-usage",
  "/api/appointments(.*)",
  "/api/calendar(.*)",
  "/api/calls(.*)",
  "/api/dnc(.*)",
  "/api/leads(.*)",
  "/api/scrape",
  "/api/search(.*)",
  "/api/settings(.*)",
  "/api/vapi/outbound(.*)",
  "/api/vapi/call(.*)",
  "/api/workspace(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const isPageRequest = request.method === "GET" || request.method === "HEAD";
  const isPrelaunchPath = pathname === "/prelaunch" || pathname.startsWith("/prelaunch/");

  if (isPageRequest && !isPrelaunchPath && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/prelaunch", request.url));
  }

  if (isProtectedRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", request.url).toString(),
    });
  }
}, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  afterSignInUrl: "/onboarding",
  afterSignUpUrl: "/onboarding",
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api)(.*)",
  ],
};
