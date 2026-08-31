import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDiscordUserAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ isAdmin: false });
  }

  const isAdmin = await isDiscordUserAdmin(session.user.id);
  return NextResponse.json({ isAdmin });
}