// lib/modmail.ts
//
// Server-side only lookup for a single modmail instance row, including its
// Dokploy IDs. Uses the Supabase SERVICE ROLE key so it can read the row
// regardless of RLS policy - never import this file from client components,
// and never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
//
// Requires these environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (found in Supabase dashboard -> Project Settings -> API)

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type ModmailInstance = {
  id: string;
  user_id: string;
  name: string | null;
  status: string | null;
  dokploy_application_id: string | null;
  dokploy_project_id: string | null;
};

export async function getModmailInstance(
  serverId: string
): Promise<ModmailInstance | null> {
  const { data, error } = await supabaseAdmin
    .from("modmail_instances")
    .select(
      "id, user_id, name, status, dokploy_application_id, dokploy_project_id"
    )
    .eq("id", serverId)
    .single();

  if (error || !data) return null;
  return data as ModmailInstance;
}