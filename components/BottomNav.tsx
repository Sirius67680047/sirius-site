"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/chine", label: "Chine", icon: "🌍" },
  { href: "/vendeur", label: "Vendeur", icon: "🏪" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0B0B10] flex justify-around py-3 border-t border-white/10 z-50">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1">
            <span className={`text-xl ${active ? "opacity-100" : "opacity-50"}`}>{tab.icon}</span>
            <span className={`text-xs font-semibold ${active ? "text-[#FF6E14]" : "text-white/50"}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}