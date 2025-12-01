"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Projects" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/pages", label: "Pages" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 text-xs pb-4">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              "rounded-full px-3 py-1.5 border transition " +
              (active
                ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-400")
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
