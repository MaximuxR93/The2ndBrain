import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SettingsModal from "@/components/SettingsModal";

export const metadata: Metadata = {
  title: "NeuralDoc — AI Research Suite",
  description: "Chat with any document using multi-provider AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex h-screen overflow-hidden bg-[#0A0A0B]">
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-[#6C63FF]/[0.04] blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#3B82F6]/[0.03] blur-[100px]" />
        </div>

        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 relative z-10">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 lg:p-7">
            {children}
          </main>
        </div>

        {/* Global modals — rendered outside main flow so they overlay everything */}
        <SettingsModal />
      </body>
    </html>
  );
}