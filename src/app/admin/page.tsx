import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isDiscordUserAdmin } from "@/lib/supabase";
import Dashboard from "@/app/dashboard/page";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = await isDiscordUserAdmin(session.user.id);

  if (!isAdmin) {
    redirect("/noaccess");
  }

  return <Dashboard user={session.user} isAdmin={isAdmin} initialView="Admin" />;
}