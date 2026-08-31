import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Server, FileText, Users } from "lucide-react";
import { auth, signOut } from "@/auth";
import { isDiscordUserAdmin } from "@/lib/supabase";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = await isDiscordUserAdmin(session.user.id);

  if (!isAdmin) {
    redirect("/noaccess");
  }

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-100">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-neutral-800 bg-neutral-900">
        <div className="flex h-16 items-center border-b border-neutral-800 px-5">
          <span className="text-sm font-semibold tracking-tight text-neutral-100">
            Admin Console
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md bg-neutral-800 px-3 py-2 text-left text-sm text-neutral-100"
          >
            <span>Admin Dashboard</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-800/60 hover:text-neutral-100"
          >
            <Server className="h-4 w-4 flex-shrink-0" />
            <span>Modmail Servers</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-800/60 hover:text-neutral-100"
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span>Logs</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-800/60 hover:text-neutral-100"
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>Accounts</span>
          </button>
        </nav>

        {/* Back to Dashboard + Sign Out */}
        <div className="flex flex-col gap-1 border-t border-neutral-800 p-3">
          <Link
            href="/dashboard"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800/60 hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" />
            <span>Back to Dashboard</span>
          </Link>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>

        <div className="border-t border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-9 w-9 flex-shrink-0 rounded-full"
              />
            ) : (
              <div className="h-9 w-9 flex-shrink-0 rounded-full bg-neutral-700" />
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-100">
                {session.user.name ?? "User"}
              </p>

              {session.user.username && (
                <p className="truncate text-xs text-neutral-500">
                  @{session.user.username}
                </p>
              )}

              <p className="text-xs text-amber-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-neutral-800 px-6">
          <div>
            <h1 className="text-lg font-semibold text-neutral-100">
              Admin Dashboard
            </h1>

            <p className="text-xs text-neutral-500">Manage DH Modmail</p>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-neutral-100">
              Admin Dashboard
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Administrative tools will appear here.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-4 text-center">
              <p className="text-2xl font-semibold text-neutral-100">--</p>
              <p className="mt-1 text-xs text-neutral-500">Open Tickets</p>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-4 text-center">
              <p className="text-2xl font-semibold text-neutral-100">--</p>
              <p className="mt-1 text-xs text-neutral-500">Total Users</p>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-4 text-center">
              <p className="text-2xl font-semibold text-neutral-100">--</p>
              <p className="mt-1 text-xs text-neutral-500">Staff Online</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}