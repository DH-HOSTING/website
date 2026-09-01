"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Server,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  FileText,
  KeyRound,
  LogOut,
  Cpu,
  MemoryStick,
  HardDrive,
} from "lucide-react";

// Client-side Supabase client using the anon/publishable key.
// Safe to expose in browser code ONLY if Row Level Security policies
// on the queried tables restrict rows to what the requester should see.
const supabaseBrowser = createClient(
  "https://vrzuaysachjrginbhgdg.supabase.co",
  "sb_publishable_65NKLAlG7kDofPxS4H3jAg_YhE6RjQ5"
);

type PageKey =
  | "Modmail Instances"
  | "Dashboard"
  | "FAQs"
  | "Privacy Policy"
  | "Terms of Service"
  | "Admin";

type ModmailInstance = {
  user_id: string;
  name: string | null;
  status: string | null;
};

const MAIN_NAV: { label: PageKey; icon: React.ElementType }[] = [
  { label: "Modmail Instances", icon: Server },
  { label: "Dashboard", icon: LayoutDashboard },
];

const POLICY_NAV: { label: PageKey; icon: React.ElementType }[] = [
  { label: "FAQs", icon: HelpCircle },
  { label: "Privacy Policy", icon: ShieldCheck },
  { label: "Terms of Service", icon: FileText },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activePage, setActivePage] = useState<PageKey>("Modmail Instances");
  const [policiesOpen, setPoliciesOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [instances, setInstances] = useState<ModmailInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(true);

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

  useEffect(() => {
    const discordId = (session?.user as { id?: string } | undefined)?.id;
    if (!discordId) return;

    setInstancesLoading(true);

    supabaseBrowser
      .from("modmail_instances")
      .select("user_id, name, status")
      .eq("user_id", discordId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load modmail instances:", error.message);
          setInstances([]);
        } else {
          setInstances(data ?? []);
        }
        setInstancesLoading(false);
      });
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

          {isAdmin && (
            <>
              <div className="my-2 border-t border-neutral-800" />
              <button
                onClick={() => router.push("/admin")}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-amber-400 transition-colors hover:bg-neutral-800 hover:text-amber-300"
              >
                <KeyRound className="h-4 w-4 flex-shrink-0" />
                <span>Admin</span>
              </button>
            </>
          )}

          <div className="my-2 border-t border-neutral-800" />

          {/* Policies dropdown */}
          <button
            onClick={() => setPoliciesOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <span>Policies</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                policiesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {policiesOpen && (
            <div className="flex flex-col gap-1">
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
        </nav>

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
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-8 py-8">
          <h1 className="text-2xl font-semibold text-neutral-100">
            Welcome back, @{user.username ?? user.name ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage all owned modmail instances. If you require support don't
            hesitate to reach out!
          </p>

          {/* Server list */}
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-neutral-300">
              Modmail Instances
            </h2>

            {instancesLoading ? (
              <p className="text-sm text-neutral-500">Loading instances...</p>
            ) : instances.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No modmail instances found for your account.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {instances.map((instance, i) => (
                  <ServerCard
                    key={`${instance.user_id}-${i}`}
                    name={instance.name ?? "UNNAMED MODMAIL"}
                    status={instance.status}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ServerCard({
  name,
  status,
}: {
  name: string;
  status: string | null;
}) {
  const isOnline = (status ?? "").toLowerCase() === "online";

  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${
          isOnline ? "bg-emerald-500" : "bg-red-500"
        }`}
      />

      <div
        className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-white ${
          isOnline ? "bg-emerald-500" : "bg-red-500"
        }`}
      >
        {isOnline ? "Online" : "Offline"}
      </div>

      <div className="px-5 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-neutral-800 text-neutral-400">
            <Server className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-neutral-100">{name}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <SpecBadge icon={Cpu} value="0%" />
          <SpecBadge icon={MemoryStick} value="0 MiB" />
          <SpecBadge icon={HardDrive} value="0 MiB" />
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-md border border-neutral-700 py-2 text-sm text-neutral-200 transition-colors hover:bg-neutral-800"
        >
          Manage Server
        </button>
      </div>
    </div>
  );
}

function SpecBadge({
  icon: Icon,
  value,
}: {
  icon: React.ElementType;
  value: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md bg-neutral-800/60 py-2 text-xs text-neutral-300">
      <Icon className="h-3.5 w-3.5 text-neutral-500" />
      <span>{value}</span>
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
        compact ? "py-2 pl-6 text-neutral-400" : "py-2.5 text-neutral-300"
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