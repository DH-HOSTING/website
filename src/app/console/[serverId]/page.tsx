"use client";

import { useEffect, useRef, useState } from "react";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Terminal,
  Settings as SettingsIcon,
  SlidersHorizontal,
  FileText,
  Play,
  Square,
  RefreshCw,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
} from "lucide-react";

type ServerData = {
  serverName: string;
  serverId: string;
  guildId: string;
  projectId: string;
  environmentId: string;
  applicationId: string;
  status: string;
  env: {
    TOKEN: string;
    GUILD_ID: string;
    OWNERS: string;
    CONNECTION_URI: string;
  };
};

const TABS = [
  { label: "Console", icon: Terminal },
  { label: "Logs", icon: FileText },
  { label: "Environment Settings", icon: SettingsIcon },
  { label: "Project Settings", icon: SlidersHorizontal },
];

export default function ConsolePage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();

  const serverId = Array.isArray(params.serverId) ? params.serverId[0] : params.serverId;

  const [activeTab, setActiveTab] = useState("Console");

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");

  const [server, setServer] = useState<ServerData | null>(null);
  const [logs, setLogs] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [botToken, setBotToken] = useState("");
  const [connectionUri, setConnectionUri] = useState("");
  const [guildId, setGuildId] = useState("");
  const [owners, setOwners] = useState("");

  const [savingEnvironment, setSavingEnvironment] = useState(false);
  const [environmentSaved, setEnvironmentSaved] = useState(false);

  const [logSearch, setLogSearch] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);

  const consoleRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  async function loadConsole(showLoader = false) {
    if (!serverId || typeof serverId !== "string") return;

    if (showLoader) {
      setRefreshing(true);
    }

    try {
      setError("");

      const response = await fetch(
        `/api/console/${encodeURIComponent(serverId)}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setForbidden(true);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load console");
      }

      setServer(data);
      setLogs(data.logs || "");

      setBotToken(data.environment?.TOKEN || "");
      setGuildId(data.environment?.GUILD_ID || "");
      setOwners(data.environment?.OWNERS || "");
      setConnectionUri(data.environment?.CONNECTION_URI || "");
    } catch (err) {
      console.error("[Console] Load error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load the server"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadLogs() {
    if (!serverId || typeof serverId !== "string") return;

    try {
      setLogsLoading(true);
      setError("");

      const query = new URLSearchParams({
        action: "logs",
        tail: "1000",
      });

      if (logSearch.trim()) {
        query.set("search", logSearch.trim());
      }

      const response = await fetch(
        `/api/console/${encodeURIComponent(serverId)}?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setForbidden(true);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load logs");
      }

      setLogs(data.logs || "");
    } catch (err) {
      console.error("[Console] Logs error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load logs"
      );
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !serverId) return;

    loadConsole(true);
  }, [status, serverId]);

  /*
   * Keep the console output updated automatically.
   */
  useEffect(() => {
    if (status !== "authenticated" || !serverId) return;

    const interval = setInterval(() => {
      loadConsole(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [status, serverId]);

  /*
   * Automatically refresh logs while on the Logs tab.
   */
  useEffect(() => {
    if (
      status !== "authenticated" ||
      !serverId ||
      activeTab !== "Logs"
    ) {
      return;
    }

    loadLogs();

    const interval = setInterval(() => {
      loadLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [status, serverId, activeTab, logSearch]);

  /*
   * Keep the console scrolled to the bottom.
   */
  useEffect(() => {
    if (!consoleRef.current) return;

    consoleRef.current.scrollTop =
      consoleRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (!logsRef.current || activeTab !== "Logs") return;

    logsRef.current.scrollTop =
      logsRef.current.scrollHeight;
  }, [logs, activeTab]);

  async function powerAction(action: string) {
    if (actionLoading || !serverId || typeof serverId !== "string") return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/console/${encodeURIComponent(serverId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setForbidden(true);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to ${action} the application`
        );
      }

      setServer((previous) => ({
        ...(previous || {} as ServerData),
        status: data.status,
      } as ServerData));

      /*
       * Give Docker a moment to react before fetching output.
       */
      setTimeout(() => {
        loadConsole(false);
      }, 1000);
    } catch (err) {
      console.error(
        `[Console] ${action} error:`,
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} the application`
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function saveEnvironment() {
    if (savingEnvironment || !serverId || typeof serverId !== "string") return;

    try {
      setSavingEnvironment(true);
      setEnvironmentSaved(false);

      const response = await fetch(
        `/api/console/${encodeURIComponent(serverId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "save-env",
            environment: {
              TOKEN: botToken,
              GUILD_ID: guildId,
              OWNERS: owners,
              CONNECTION_URI: connectionUri,
            },
          }),
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setForbidden(true);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save environment"
        );
      }

      setEnvironmentSaved(true);

      setTimeout(() => {
        setEnvironmentSaved(false);
      }, 4000);
    } catch (err) {
      console.error(
        "[Console] Environment save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save environment"
      );
    } finally {
      setSavingEnvironment(false);
    }
  }

  function getStatus() {
    return String(server?.status || "unknown").toLowerCase();
  }

  const isRunning =
    getStatus().includes("running") ||
    getStatus() === "ready" ||
    getStatus() === "healthy";

  const isStopped =
    getStatus().includes("stopped") ||
    getStatus().includes("exited") ||
    getStatus() === "inactive";

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-950 text-neutral-400">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading console...
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-neutral-950 text-neutral-100">
        <p className="text-lg font-medium">
          You don't have access to this server.
        </p>

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
              {server?.serverName || "Console"}
            </h1>

            <p className="text-xs text-neutral-500">
              Server ID: {serverId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2">
            {isRunning ? (
              <span className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Running
              </span>
            ) : isStopped ? (
              <span className="flex items-center gap-2 text-xs text-neutral-400">
                <Square className="h-3.5 w-3.5" />
                Stopped
              </span>
            ) : (
              <span className="flex items-center gap-2 text-xs text-yellow-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {server?.status || "Unknown"}
              </span>
            )}
          </div>

          {isRunning ? (
            <button
              onClick={() => powerAction("stop")}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-md border border-red-900/60 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Stop
            </button>
          ) : (
            <button
              onClick={() => powerAction("start")}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start
            </button>
          )}
        </div>
      </header>

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

      {error && (
        <div className="mx-6 mt-4 rounded-md border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          <div className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span className="whitespace-pre-wrap break-words">{error}</span>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {activeTab === "Console" && (
          <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-lg border border-neutral-800 bg-black">
            <div className="flex h-11 flex-shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-neutral-500" />

                <span className="text-xs font-medium text-neutral-400">
                  Container Console
                </span>

                <span className="text-xs text-neutral-700">
                  •
                </span>

                <span className="text-xs text-neutral-600">
                  Live
                </span>
              </div>

              <button
                onClick={() => loadConsole(true)}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>

            <div
              ref={consoleRef}
              className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-5 text-neutral-300"
            >
              {logs ? (
                <pre className="whitespace-pre-wrap break-words">
                  {logs}
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-700">
                  No console output available.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Logs" && (
          <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-lg border border-neutral-800 bg-black">
            <div className="flex flex-shrink-0 flex-col gap-3 border-b border-neutral-800 bg-neutral-950 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-neutral-500" />

                <span className="text-xs font-medium text-neutral-400">
                  Application Logs
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" />

                  <input
                    value={logSearch}
                    onChange={(e) =>
                      setLogSearch(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        loadLogs();
                      }
                    }}
                    placeholder="Search logs..."
                    className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-xs text-neutral-200 placeholder-neutral-600 outline-none focus:border-neutral-600"
                  />
                </div>

                <button
                  onClick={loadLogs}
                  disabled={logsLoading}
                  className="flex items-center gap-2 rounded-md border border-neutral-800 px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      logsLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div
              ref={logsRef}
              className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-5 text-neutral-300"
            >
              {logs ? (
                <pre className="whitespace-pre-wrap break-words">
                  {logs}
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-700">
                  No logs available.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Environment Settings" && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-neutral-100">
                Environment Settings
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                These values are written directly to the
                application's Dokploy environment.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <Field
                label="TOKEN"
                type="password"
                value={botToken}
                onChange={setBotToken}
                placeholder="Enter bot token"
              />

              <Field
                label="GUILD_ID"
                value={guildId}
                onChange={setGuildId}
                placeholder="Enter Discord guild ID"
              />

              <Field
                label="OWNERS"
                value={owners}
                onChange={setOwners}
                placeholder="123456789012345678,987654321098765432"
              />

              <Field
                label="CONNECTION_URI"
                value={connectionUri}
                onChange={setConnectionUri}
                placeholder="postgres://..."
              />

              <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-3">
                <p className="text-xs text-neutral-500">
                  The saved environment will be written as:
                </p>

                <pre className="mt-2 overflow-x-auto rounded-md bg-black p-3 font-mono text-xs leading-5 text-neutral-400">
{`TOKEN=...
GUILD_ID=...
OWNERS=...
CONNECTION_URI=...`}
                </pre>
              </div>

              <button
                type="button"
                onClick={saveEnvironment}
                disabled={savingEnvironment}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-100 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingEnvironment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : environmentSaved ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {savingEnvironment
                  ? "Saving..."
                  : environmentSaved
                  ? "Changes Saved"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "Project Settings" && (
          <div className="flex h-full min-h-[400px] items-center justify-center text-sm text-neutral-500">
            Project settings coming soon.
          </div>
        )}
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
  onChange: (value: string) => void;
  placeholder: string;
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
        className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-neutral-600"
      />
    </div>
  );
}