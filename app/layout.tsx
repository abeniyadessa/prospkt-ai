import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospkt — AI Sales Rep",
  description: "Autonomous AI sales rep that finds leads, calls them, and books discovery calls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full antialiased bg-white text-black"
        style={{ fontFamily: "'Switzer', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
