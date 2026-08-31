"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Server,
  Settings,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  FileText,
} from "lucide-react";

type PageKey =
  | "My Instances"
  | "Dashboard"
  | "Settings"
  | "FAQs"
  | "Privacy Policy"
  | "Terms of Service";

const MAIN_NAV: { label: PageKey; icon: React.ElementType }[] = [
  { label: "My Instances", icon: Server },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Settings", icon: Settings },
];

const POLICY_NAV: { label: PageKey; icon: React.ElementType }[] = [
  { label: "FAQs", icon: HelpCircle },
  { label: "Privacy Policy", icon: ShieldCheck },
  { label: "Terms of Service", icon: FileText },
];

export default function Page() {
  const [activePage, setActivePage] = useState<PageKey>("Dashboard");
  const [policiesOpen, setPoliciesOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-neutral-800 bg-neutral-900">
        <div className="flex h-16 items-center border-b border-neutral-800 px-5">
          <span className="text-sm font-semibold tracking-tight text-neutral-100">
            Console
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {MAIN_NAV.map(({ label, icon: Icon }) => (
            <NavButton
              key={label}
              label={label}
              icon={Icon}
              active={activePage === label}
              onClick={() => setActivePage(label)}
            />
          ))}
        </nav>

        {/* Policies dropdown, pinned to bottom */}
        <div className="border-t border-neutral-800 p-3">
          <button
            onClick={() => setPoliciesOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <span>Policies</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                policiesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {policiesOpen && (
            <div className="mt-1 flex flex-col gap-1">
              {POLICY_NAV.map(({ label, icon: Icon }) => (
                <NavButton
                  key={label}
                  label={label}
                  icon={Icon}
                  active={activePage === label}
                  onClick={() => setActivePage(label)}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center">
        <h1 className="text-2xl font-medium text-neutral-200">
          {activePage} — Coming Soon
        </h1>
      </main>
    </div>
  );
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
  compact,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 text-sm transition-colors ${
        compact ? "py-1.5 pl-6 text-neutral-400" : "py-2 text-neutral-300"
      } ${
        active
          ? "bg-neutral-800 text-neutral-100"
          : "hover:bg-neutral-800/60 hover:text-neutral-100"
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}