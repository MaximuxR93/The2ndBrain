import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import SettingsModal from "@/components/SettingsModal";

export const metadata: Metadata = {
  title: "SecondBrain AI — Knowledge Workspace",
  description: "Your AI-powered second brain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,600,500,400&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="flex h-screen overflow-hidden font-sans" style={{ background: "#07070C" }}>

        {/* ── Ambient background ── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 dot-grid" />
          <div className="absolute -top-[15%] -left-[8%] w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 65%)" }} />
          <div className="absolute top-[5%] left-[25%] w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(30,58,138,0.05) 0%, transparent 65%)" }} />
          <div className="absolute bottom-[-10%] right-[0%] w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(76,29,149,0.06) 0%, transparent 65%)" }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(124,92,252,0.3), transparent)" }} />
        </div>

        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 relative z-10 overflow-hidden">
          <Topbar />
          {/* pb-16 on mobile to clear the bottom nav */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />

        <SettingsModal />
      </body>
    </html>
  );
}
