import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin, isDiscordUserAdmin } from "@/lib/supabase";

const DOKPLOY_URL =
process.env.DOKPLOY_URL || "https://modmail.dhmodmail.co.uk";

const DOKPLOY_API_KEY = process.env.DOKPLOY_API_KEY || "";

type Instance = {
id: string;
user_id: string;
name: string;
discord_guild_id: string;
dokploy_project_id: string;
dokploy_environment_id: string;
dokploy_application_id: string;
status: string | null;
};

type EnvValues = {
TOKEN: string;
GUILD_ID: string;
OWNERS: string;
CONNECTION_URI: string;
};

type DokployResponse = {
[key: string]: unknown;
};

const ENV_KEYS = [
"TOKEN",
"GUILD_ID",
"OWNERS",
"CONNECTION_URI",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

function dokployHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": DOKPLOY_API_KEY,
  };
}

function trpcQuery(procedure: string, input: Record<string, unknown>): string {
  return `${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`;
}

function unwrapDokployData(data: DokployResponse): DokployResponse {
  if (data && typeof data === "object") {
    const result = (data as DokployResponse).result;
    if (result && typeof result === "object") {
      const nested = result as DokployResponse;
      if ("data" in nested && nested.data && typeof nested.data === "object") {
        return nested.data as DokployResponse;
      }
    }
  }

  return data;
}

async function dokployRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!DOKPLOY_API_KEY) {
    throw new Error("DOKPLOY_API_KEY is not configured");
  }

  const baseUrl = DOKPLOY_URL.replace(/\/$/, "");
  const url = `${baseUrl}/api/trpc/${path}`;

  console.log("[DOKPLOY] Request URL:", url);

  return fetch(url, {
    ...options,
    headers: {
      ...dokployHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

async function getInstance(
serverId: string,
discordId: string
): Promise<
| { instance: Instance }
| { error: NextResponse }
> {
  const admin = await isDiscordUserAdmin(discordId);

  const { data, error } = await supabaseAdmin
.from("modmail_instances")
.select(
`         id,
        user_id,
        name,
        discord_guild_id,
        dokploy_project_id,
        dokploy_environment_id,
        dokploy_application_id,
        status
      `
)
.eq("id", serverId)
.maybeSingle();

if (error) {
    console.error("[CONSOLE] Supabase lookup failed:", error);

    return {
      error: NextResponse.json(
        { error: "Failed to load server instance" },
        { status: 500 }
      ),
    };
}

if (!data) {
return {
error: NextResponse.json(
{ error: "Server instance not found" },
{ status: 404 }
),
};
}

const instance = data as Instance;

if (!admin && instance.user_id !== discordId) {
return {
error: NextResponse.json(
{ error: "Forbidden" },
{ status: 403 }
),
};
}

return { instance };
}

function parseEnv(envText: string): EnvValues {
  const values: EnvValues = {
    TOKEN: "",
    GUILD_ID: "",
    OWNERS: "",
    CONNECTION_URI: "",
  };

  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();

    if ((ENV_KEYS as readonly string[]).includes(key)) {
      values[key as EnvKey] = value;
    }
  }

  return values;
}

function createEnvText(values: EnvValues): string {
  return [
    `TOKEN=${values.TOKEN}`,
    `GUILD_ID=${values.GUILD_ID}`,
    `OWNERS=${values.OWNERS}`,
    `CONNECTION_URI=${values.CONNECTION_URI}`,
  ].join("\n");
}

function normaliseOwners(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((owner: unknown) => String(owner).trim())
      .filter(Boolean)
      .join(",");
  }

  return String(value ?? "").trim();
}

async function readApplicationEnvironment(
  applicationId: string
): Promise<EnvValues> {
  try {
    const query = trpcQuery("application.one", { applicationId });
    console.log("[CONSOLE] Calling Dokploy:", query);

    const response = await dokployRequest(query);

    if (!response.ok) {
      const text = await response.text();

      console.error(
        "[CONSOLE] Dokploy API returned error:",
        response.status,
        text
      );

      throw new Error(`Dokploy API error ${response.status}: ${text}`);
    }

    const raw = (await response.json()) as DokployResponse;
    const data = unwrapDokployData(raw);
    console.log("[CONSOLE] Dokploy response data:", data);

    return parseEnvFromResponse(data);
  } catch (error) {
    console.error(
      "[CONSOLE] readApplicationEnvironment error:",
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

function parseEnvFromResponse(data: DokployResponse): EnvValues {
  const rawData = data && typeof data === "object" ? data : {};
  const possibleEnv =
    typeof rawData.env === "string"
      ? rawData.env
      : typeof rawData.environment === "string"
      ? rawData.environment
      : "";

  if (!possibleEnv) {
    return {
      TOKEN: "",
      GUILD_ID: "",
      OWNERS: "",
      CONNECTION_URI: "",
    };
  }

  return parseEnv(possibleEnv);
}

async function saveApplicationEnvironment(
  applicationId: string,
  values: EnvValues
): Promise<void> {
  try {
    const env = createEnvText(values);

    console.log("[CONSOLE] Calling saveEnvironment for:", applicationId);

    const response = await dokployRequest("application.saveEnvironment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          applicationId,
          env,
          buildArgs: "",
          buildSecrets: "",
          createEnvFile: true,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();

      console.error(
        "[CONSOLE] Dokploy environment save failed:",
        response.status,
        text
      );

      throw new Error(`Failed to save environment: ${response.status} ${text}`);
    }

    console.log("[CONSOLE] Environment saved to Dokploy");
  } catch (error) {
    console.error("[CONSOLE] saveApplicationEnvironment error:", error);
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { serverId } = await params;

    if (!serverId) {
      return NextResponse.json(
        { error: "Missing server ID" },
        { status: 400 }
      );
    }

    const result = await getInstance(serverId, session.user.id);

    if ("error" in result) {
      return result.error;
    }

    const { instance } = result;

    const url = new URL(request.url);
    const action =
      url.searchParams.get("action") || url.searchParams.get("view");

    /*
     * LOGS
     *
     * Example:
     * /api/console/INSTANCE_ID?action=logs
     */
    if (action === "logs") {
      const logsResponse = await dokployRequest(
        trpcQuery("application.readLogs", {
          applicationId: instance.dokploy_application_id,
          tail: 200,
          since: "all",
        })
      );

      if (!logsResponse.ok) {
        const text = await logsResponse.text();

        console.error(
          "[CONSOLE] Dokploy logs failed:",
          logsResponse.status,
          text
        );

        return NextResponse.json(
          { error: "Failed to retrieve logs" },
          { status: 502 }
        );
      }

      const rawLogs = (await logsResponse.json()) as DokployResponse;
      const logsData = unwrapDokployData(rawLogs);

      return NextResponse.json({
        logs:
          typeof logsData?.logs === "string"
            ? logsData.logs
            : typeof logsData?.output === "string"
            ? logsData.output
            : typeof logsData?.data === "string"
            ? logsData.data
            : JSON.stringify(logsData ?? {}),
      });
    }

    /*
     * ENVIRONMENT
     */
    let env: EnvValues = {
      TOKEN: "",
      GUILD_ID: "",
      OWNERS: "",
      CONNECTION_URI: "",
    };

    try {
      env = await readApplicationEnvironment(
        instance.dokploy_application_id
      );
    } catch (error) {
      console.error("[CONSOLE] Environment read error:", error);
    }

    return NextResponse.json({
      serverName: instance.name,
      serverId: instance.id,
      guildId: instance.discord_guild_id,
      projectId: instance.dokploy_project_id,
      environmentId: instance.dokploy_environment_id,
      applicationId: instance.dokploy_application_id,
      status: instance.status || "unknown",
      env,
    });
  } catch (error) {
    console.error("[CONSOLE] GET error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { serverId } = await params;

    if (!serverId) {
      return NextResponse.json(
        { error: "Missing server ID" },
        { status: 400 }
      );
    }

    const result = await getInstance(serverId, session.user.id);

    if ("error" in result) {
      return result.error;
    }

    const { instance } = result;

    const body = (await request.json()) as {
      action?: string;
      env?: Partial<EnvValues>;
      environment?: Partial<EnvValues>;
    };

    const action =
      body.action === "saveEnvironment" ? "save-env" : body.action;

    /*
     * START
     */
    if (action === "start") {
      try {
        console.log(
          "[CONSOLE] Starting application:",
          instance.dokploy_application_id
        );

const response = await dokployRequest("application.start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          applicationId: instance.dokploy_application_id,
        },
      }),
    });

        if (!response.ok) {
          const text = await response.text();

          console.error(
            "[CONSOLE] Dokploy start failed:",
            response.status,
            text
          );

          return NextResponse.json(
            {
              error: `Failed to start application: ${text}`,
            },
            { status: 502 }
          );
        }

        console.log("[CONSOLE] Application started successfully");

        await supabaseAdmin
          .from("modmail_instances")
          .update({
            status: "running",
            updated_at: new Date().toISOString(),
          })
          .eq("id", instance.id);

        return NextResponse.json({
          success: true,
          status: "running",
        });
      } catch (err) {
        console.error("[CONSOLE] Start action error:", err);
        throw err;
      }
    }

    /*
     * STOP
     */
    if (action === "stop") {
      try {
        console.log(
          "[CONSOLE] Stopping application:",
          instance.dokploy_application_id
        );

const response = await dokployRequest("application.stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          applicationId: instance.dokploy_application_id,
        },
      }),
    });

        if (!response.ok) {
          const text = await response.text();

          console.error(
            "[CONSOLE] Dokploy stop failed:",
            response.status,
            text
          );

          return NextResponse.json(
            {
              error: `Failed to stop application: ${text}`,
            },
            { status: 502 }
          );
        }

        console.log("[CONSOLE] Application stopped successfully");

        await supabaseAdmin
          .from("modmail_instances")
          .update({
            status: "stopped",
            updated_at: new Date().toISOString(),
          })
          .eq("id", instance.id);

        return NextResponse.json({
          success: true,
          status: "stopped",
        });
      } catch (err) {
        console.error("[CONSOLE] Stop action error:", err);
        throw err;
      }
    }

    /*
     * SAVE ENVIRONMENT
     *
     * This updates the actual Dokploy application's environment
     * and asks Dokploy to create/update the .env file.
     */
    if (action === "save-env") {
      try {
        console.log(
          "[CONSOLE] Reading current environment from:",
          instance.dokploy_application_id
        );

        const currentEnv = await readApplicationEnvironment(
          instance.dokploy_application_id
        );

        const incomingEnv = body.env || body.environment || {};

        const updatedEnv: EnvValues = {
          TOKEN:
            typeof incomingEnv.TOKEN === "string"
              ? incomingEnv.TOKEN
              : currentEnv.TOKEN,

          GUILD_ID:
            typeof incomingEnv.GUILD_ID === "string"
              ? incomingEnv.GUILD_ID
              : currentEnv.GUILD_ID,

          OWNERS:
            incomingEnv.OWNERS !== undefined
              ? normaliseOwners(incomingEnv.OWNERS)
              : currentEnv.OWNERS,

          CONNECTION_URI:
            typeof incomingEnv.CONNECTION_URI === "string"
              ? incomingEnv.CONNECTION_URI
              : currentEnv.CONNECTION_URI,
        };

        console.log("[CONSOLE] Saving environment to Dokploy");

        await saveApplicationEnvironment(
          instance.dokploy_application_id,
          updatedEnv
        );

        console.log("[CONSOLE] Environment saved successfully");

        await supabaseAdmin
          .from("modmail_instances")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", instance.id);

        return NextResponse.json({
          success: true,
          env: updatedEnv,
        });
      } catch (err) {
        console.error("[CONSOLE] Save environment error:", err);
        throw err;
      }
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[CONSOLE] POST error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
