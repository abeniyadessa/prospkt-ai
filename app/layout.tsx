import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://prospkt.ai"),
  title: "Prospkt — AI Sales Rep",
  description:
    "AI sales rep for service businesses that follows up, books jobs, and logs every revenue opportunity.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      localization={{
        signIn: {
          start: {
            title: "Sign in to Prospkt",
            subtitle: "Welcome back. Sign in to continue.",
            actionText: "New to Prospkt?",
            actionLink: "Create an account",
          },
        },
        signUp: {
          start: {
            title: "Create your Prospkt workspace",
            subtitle: "Create your account to start workspace setup.",
            actionText: "Already have access?",
            actionLink: "Sign in",
          },
        },
      }}
      appearance={{
        variables: {
          colorPrimary: "#0A0A0A",
          colorText: "#0A0A0A",
          colorBackground: "#FFFFFF",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html lang="en" className="h-full">
        <head>
          <link rel="preconnect" href="https://api.fontshare.com" />
          <link
            rel="stylesheet"
            href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap"
          />
        </head>
        <body className="min-h-full antialiased">
          <TooltipProvider>{children}</TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
