"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Terminal,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Wifi,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Plus,
  X,
} from "lucide-react";

type Tab = "Docker Output" | "Environment Settings" | "Project Settings";

const TABS: { label: Tab; icon: React.ElementType }[] = [
  { label: "Docker Output", icon: Terminal },
  { label: "Environment Settings", icon: SettingsIcon },
  { label: "Project Settings", icon: SlidersHorizontal },
];

type ServerInfo = {
  serverName: string;
  address: string;
  uptime: string;
  cpuLoad: string;
  memory: string;
  disk: string;
};

export default function ConsolePage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams<{ serverId: string }>();
  const serverId = params.serverId;

  const [activeTab, setActiveTab] = useState<Tab>("Docker Output");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [server, setServer] = useState<ServerInfo | null>(null);

  // Env settings state
  const [botToken, setBotToken] = useState("");
  const [connectionUri, setConnectionUri] = useState("");
  const [guildId, setGuildId] = useState("");
  const [owners, setOwners] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !serverId) return;

    fetch(`/api/console/${serverId}`)
      .then(async (res) => {
        if (res.status === 403 || res.status === 401) {
          setForbidden(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setServer(data);
      })
      .finally(() => setLoading(false));
  }, [status, serverId]);

  function addOwner() {
    if (owners.length >= 3) return;
    const id = window.prompt("Enter Discord ID to add as an owner:");
    if (!id) return;
    const trimmed = id.trim();
    if (!trimmed) return;
    if (owners.includes(trimmed)) return;
    setOwners((prev) => [...prev, trimmed]);
  }

  function removeOwner(id: string) {
    setOwners((prev) => prev.filter((o) => o !== id));
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-950 text-neutral-400">
        Loading...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-neutral-950 text-neutral-100">
        <p className="text-lg font-medium">You don't have access to this server.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-neutral-950 text-neutral-100">
      {/* Top bar */}
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-neutral-800 px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            title="Back to Dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-neutral-100">
              {server?.serverName ?? "Console"}
            </h1>
            <p className="text-xs text-neutral-500">Server ID: {serverId}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-shrink-0 gap-1 border-b border-neutral-800 px-6 pt-3">
        {TABS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2.5 text-sm transition-colors ${
              activeTab === label
                ? "border-neutral-100 text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "Docker Output" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
            {/* Log panel */}
            <div className="rounded-lg border border-neutral-800 bg-black/40 p-4 font-mono text-xs text-neutral-300">
              <p className="text-emerald-400">Docker Ready</p>
              <p className="text-neutral-300">DH Modmail Responding &amp; Healthy</p>
              <p className="text-neutral-500">Ready for power management input.</p>
            </div>

            {/* Stat cards */}
            <div className="flex flex-col gap-4">
              <StatCard icon={Wifi} label="Address" value={server?.address ?? "--"} />
              <StatCard icon={Clock} label="Uptime" value={server?.uptime ?? "--"} />
              <StatCard icon={Cpu} label="CPU Load" value={server?.cpuLoad ?? "--"} suffix=" / ∞" />
              <StatCard icon={MemoryStick} label="Memory" value={server?.memory ?? "--"} suffix=" / ∞" />
              <StatCard icon={HardDrive} label="Disk" value={server?.disk ?? "--"} suffix=" / ∞" />
            </div>
          </div>
        )}

        {activeTab === "Environment Settings" && (
          <div className="max-w-xl">
            <div className="flex flex-col gap-5">
              <Field
                label="BOT_TOKEN"
                type="password"
                value={botToken}
                onChange={setBotToken}
                placeholder="Enter bot token"
              />

              <Field
                label="CONNECTION_URI"
                value={connectionUri}
                onChange={setConnectionUri}
                placeholder="postgres://..."
              />

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  DISCORD_OWNERS
                </p>
                <div className="flex flex-col gap-2">
                  {owners.map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
                    >
                      <span className="font-mono">{id}</span>
                      <button
                        onClick={() => removeOwner(id)}
                        className="text-neutral-500 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {owners.length < 3 && (
                    <button
                      onClick={addOwner}
                      className="flex items-center justify-center gap-2 rounded-md border border-dashed border-neutral-700 py-2 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
                    >
                      <Plus className="h-4 w-4" />
                      Add Owner ({owners.length}/3)
                    </button>
                  )}
                </div>
              </div>

              <Field
                label="DISCORD_GUILD_ID"
                value={guildId}
                onChange={setGuildId}
                placeholder="Enter guild ID"
              />

              <button
                type="button"
                className="mt-2 w-full rounded-md bg-neutral-100 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === "Project Settings" && (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Project settings coming soon.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-neutral-800 text-neutral-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="truncate text-sm font-medium text-neutral-100">
          {value}
          {suffix && <span className="text-neutral-500">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-neutral-600"
      />
    </div>
  );
}