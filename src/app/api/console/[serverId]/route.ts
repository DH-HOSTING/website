import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isServerOwner, isDiscordUserAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const session = await auth();
  const { serverId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [owns, admin] = await Promise.all([
    isServerOwner(session.user.id, serverId),
    isDiscordUserAdmin(session.user.id),
  ]);

  if (!owns && !admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // TODO: replace with a real lookup (Docker/Pterodactyl) for this serverId
  return NextResponse.json({
    serverName: "PLACEHOLDER MODMAIL",
    address: "82.38.134.125:25565",
    uptime: "7h 43m 1s",
    cpuLoad: "0.25%",
    memory: "45.95 MiB",
    disk: "89.53 MiB",
  });
}