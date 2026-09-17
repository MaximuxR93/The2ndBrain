import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SecondBrain AI — Knowledge Workspace",
  description: "Your AI-powered second brain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans bg-[#07070C] text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}