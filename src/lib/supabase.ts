import { createClient } from "@supabase/supabase-js";

// Server-only client — uses the service role key so it can read the
// Accounts table regardless of RLS policies. Never import this into a
// "use client" file or expose these env vars to the browser.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function isDiscordUserAdmin(discordId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("Accounts")
    .select("Admin")
    .eq("DiscordId", discordId)
    .maybeSingle();

  if (error || !data) return false;
  return Boolean(data.Admin);
}