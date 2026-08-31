"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Settings,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  FileText,
  KeyRound,
  LogOut,
} from "lucide-react";

type PageKey =
  | "My Instances"
  | "Dashboard"
  | "Settings"
  | "FAQs"
  | "Privacy Policy"
  | "Terms of Service"
  | "Admin";

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activePage, setActivePage] = useState<PageKey>("Dashboard");
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/is-admin")
      .then((res) => res.json())
      .then((data) => setIsAdmin(Boolean(data.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, [session]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-950 text-neutral-400">
        Loading...
      </div>
    );
  }

  const user = session.user as {
    name?: string | null;
    username?: string;
    image?: string | null;
  };

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

        {isAdmin && (
          <div className="px-3">
            <button
              onClick={() => setActivePage("Admin")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                activePage === "Admin"
                  ? "bg-neutral-800 text-amber-300"
                  : "text-amber-400 hover:bg-neutral-800 hover:text-amber-300"
              }`}
            >
              <KeyRound className="h-4 w-4 flex-shrink-0" />
              <span>Admin</span>
            </button>
          </div>
        )}

        {/* Policies dropdown */}
        <div className="px-3 pb-4 pt-2">
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

        {/* Profile card */}
        <div className="flex items-center gap-3 border-t border-neutral-800 px-4 py-3">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-9 w-9 flex-shrink-0 rounded-full"
            />
          ) : (
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-neutral-700" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-100">
              {user.name}
            </p>
            <p className="truncate text-xs text-neutral-500">
              @{user.username}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
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