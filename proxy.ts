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
  const isMarketingPreviewPath =
    pathname === "/marketing-preview" || pathname.startsWith("/marketing-preview/");
  const requestHost = request.headers.get("host") ?? request.nextUrl.host;
  const isLocalHost =
    requestHost.startsWith("localhost") ||
    requestHost.startsWith("127.0.0.1") ||
    requestHost === "::1" ||
    requestHost === "[::1]" ||
    requestHost.startsWith("[::1]:");
  const isAuthPath =
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    pathname === "/sign-up" ||
    pathname.startsWith("/sign-up/") ||
    pathname === "/sso-callback" ||
    pathname.startsWith("/sso-callback/");
  const isProtectedRequest = isProtectedRoute(request);

  if (isProtectedRequest) {
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", request.url).toString(),
    });
  }

  if (
    isPageRequest &&
    !isPrelaunchPath &&
    !(isMarketingPreviewPath && isLocalHost) &&
    !isAuthPath &&
    !isProtectedRequest &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/prelaunch", request.url));
  }
}, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  afterSignInUrl: "/onboarding",
  afterSignUpUrl: "/onboarding",
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|wav|mp3|m4a|ogg|aac|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api)(.*)",
  ],
};
