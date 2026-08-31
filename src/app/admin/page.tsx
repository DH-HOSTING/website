import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

return ( <div className="flex h-screen w-full bg-neutral-950 text-neutral-100"> <aside className="flex w-64 flex-shrink-0 flex-col border-r border-neutral-800 bg-neutral-900"> <div className="flex h-16 items-center border-b border-neutral-800 px-5"> <span className="text-sm font-semibold tracking-tight text-neutral-100">
Admin Console </span> </div>

```
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <button className="flex items-center gap-3 rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-100">
        <span>Admin Dashboard</span>
      </button>
    </nav>

    <div className="border-t border-neutral-800 px-4 py-3">
      <div className="flex items-center gap-3">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
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
            {session.user.name}
          </p>

          {session.user.username && (
            <p className="truncate text-xs text-neutral-500">
              @{session.user.username}
            </p>
          )}

          <p className="text-xs text-amber-400">
            Administrator
          </p>
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
        <p className="text-xs text-neutral-500">
          Manage DH Modmail
        </p>
      </div>
    </header>

    <section className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-medium text-neutral-100">
          Admin Dashboard
        </h2>

        <p className="mt-2 text-sm text-neutral-500">
          Administrative tools will appear here.
        </p>
      </div>
    </section>
  </main>
</div>
```

);
}
