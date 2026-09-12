"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { NAV_LINKS } from "@/lib/nav-links";

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
      {NAV_LINKS.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative rounded-full px-3 py-1.5 transition-colors ${
              isActive ? "text-foreground" : "hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-full bg-muted"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
