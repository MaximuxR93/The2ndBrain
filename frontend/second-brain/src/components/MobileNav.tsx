"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, MessageSquare, Lightbulb } from "lucide-react";

const NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Chat",      href: "/chat",       icon: MessageSquare },
  { name: "Insights",  href: "/insights",  icon: Lightbulb },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
      style={{
        background: "rgba(7,7,12,0.92)",
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4), 0 -1px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      {NAV.map(({ name, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link key={name} href={href}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 min-w-0"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
              active ? "bg-[#7C5CFC]/20" : "bg-transparent"
            }`}
              style={active ? { boxShadow: "0 0 12px rgba(124,92,252,0.25)" } : {}}>
              <Icon size={18} strokeWidth={1.8}
                className={active ? "text-[#9B7DFF]" : "text-[#5A5C6A]"} />
            </div>
            <span className={`text-[10px] font-semibold leading-none ${active ? "text-[#9B7DFF]" : "text-[#3A3C4A]"}`}>
              {name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
