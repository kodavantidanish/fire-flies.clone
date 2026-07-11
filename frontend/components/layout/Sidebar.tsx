"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Bot,
  Video,
  Activity,
  UploadCloud,
  Layers,
  BarChart2,
  Briefcase,
  Sparkles,
  Users,
  Lock,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "AskFred", href: "/ask-fred", icon: Bot, shortcut: "Ctrl+J" },
  { label: "Meetings", href: "/", icon: Video },
  { label: "Meeting Status", href: "/meeting-status", icon: Activity },
  { label: "Uploads", href: "/uploads", icon: UploadCloud },
];

const secondaryNav = [
  { label: "Integrations", href: "/integrations", icon: Layers },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Voice Agents", href: "/voice-agents", icon: Briefcase, badge: "NEW" },
  { label: "AI Skills", href: "/ai-skills", icon: Sparkles },
];

const tertiaryNav = [
  { label: "Team", href: "/team", icon: Users },
  { label: "Your Privacy Choices", href: "/privacy", icon: Lock },
];

function NavItem({
  label,
  href,
  icon: Icon,
  shortcut,
  badge,
  active,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  shortcut?: string;
  badge?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-ink-700 hover:bg-gray-100 hover:text-ink-900"
      )}
    >
      <Icon
        size={17}
        strokeWidth={2}
        className={cn(active ? "text-brand-600" : "text-ink-500 group-hover:text-ink-700")}
      />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          {badge}
        </span>
      )}
      {shortcut && <span className="text-[11px] text-ink-300">{shortcut}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [showInvite, setShowInvite] = useState(true);

  return (
    <aside className="flex h-screen w-[264px] shrink-0 flex-col border-r border-gray-100 bg-white px-3 py-4">
      <div className="flex items-center gap-2 px-2 pb-5 pt-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-pink-500 to-rose-600 text-white">
          <Sparkles size={15} fill="white" />
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-ink-900">firelog</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {primaryNav.map((item) => (
          <NavItem key={item.label} {...item} active={pathname === item.href} />
        ))}
      </nav>

      <div className="my-3 h-px bg-gray-100" />

      <nav className="flex flex-col gap-0.5">
        {secondaryNav.map((item) => (
          <NavItem key={item.label} {...item} active={pathname === item.href} />
        ))}
      </nav>

      <div className="my-3 h-px bg-gray-100" />

      <nav className="flex flex-col gap-0.5">
        {tertiaryNav.map((item) => (
          <NavItem key={item.label} {...item} active={pathname === item.href} />
        ))}
      </nav>

      <div className="flex-1" />

      {showInvite && (
        <div className="relative rounded-xl2 bg-gray-50 p-4">
          <button
            onClick={() => setShowInvite(false)}
            className="absolute right-2.5 top-2.5 text-ink-300 hover:text-ink-500"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <p className="pr-4 text-[13px] leading-snug text-ink-700">
            Invite coworkers to your firelog team
          </p>
          <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700">
            <Plus size={15} />
            Create Team
          </button>
        </div>
      )}
    </aside>
  );
}
