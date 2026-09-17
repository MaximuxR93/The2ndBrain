"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import SettingsModal from "@/components/SettingsModal";
import ToastContainer from "@/components/Toast";
import DocumentsHydrator from "@/components/DocumentsHydrator";
import SmoothScroll from "@/components/SmoothScroll";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), {
  ssr: false,
});

/**
 * The landing page ("/") is its own cinematic, full-bleed experience — no
 * sidebar, no topbar, no ambient particle background competing with the
 * ParticleUniverse. It gets Lenis smooth-scroll (SmoothScroll) since that's
 * what the GSAP ScrollTrigger chapter morphs are built against.
 *
 * Every other route keeps the app shell exactly as before, no Lenis —
 * the dashboard's own scroll areas (chat, tables, etc.) don't need it and
 * Lenis intercepting scroll there would just be extra unneeded complexity.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return <SmoothScroll>{children}</SmoothScroll>;
  }

  return (
    <>
      <ThreeBackground />
      <DocumentsHydrator />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 relative z-10 overflow-hidden bg-transparent">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0 bg-transparent">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
      <SettingsModal />
      <ToastContainer />
    </>
  );
}