"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Pipeline T.A.", href: "/" },
  { label: "Calendario", href: "/calendario" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-desmex-red-dark sticky top-0 z-10 shadow-md">
      <div className="px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg tracking-wide">DESMEX</span>
          <span className="text-white/30 hidden md:block">|</span>
          <span className="text-white/70 text-sm font-medium hidden md:block">
            Ventas Desmex
          </span>
        </div>

        {/* Tabs — centrados y prominentes */}
        <div className="absolute left-1/2 -translate-x-1/2 flex h-full">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center px-8 h-full text-sm font-semibold border-b-[3px] transition-all ${
                  active
                    ? "border-white text-white"
                    : "border-transparent text-white/60 hover:text-white hover:border-white/40"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
