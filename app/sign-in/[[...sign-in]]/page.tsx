import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/app/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell mode="sign-in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        signUpFallbackRedirectUrl="/onboarding"
        fallbackRedirectUrl="/onboarding"
        forceRedirectUrl="/onboarding"
        oauthFlow="redirect"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "w-full border-0 shadow-none",
            headerTitle: "text-[24px] font-semibold text-foreground",
            headerSubtitle: "text-[13.5px] text-muted-foreground",
            formButtonPrimary: "bg-foreground hover:bg-[#1F1F1F]",
            footerActionLink: "text-foreground",
          },
        }}
      />
    </AuthShell>
  );
}
