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

async function dokployRequest(
path: string,
options: RequestInit = {}
): Promise<Response> {
if (!DOKPLOY_API_KEY) {
throw new Error("DOKPLOY_API_KEY is not configured");
}

const url = `${DOKPLOY_URL.replace(/\/$/, "")}/api/${path}`;

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
  const response = await dokployRequest(
    `application.one?applicationId=${encodeURIComponent(applicationId)}`
  );

  if (!response.ok) {
    const text = await response.text();

    console.error(
      "[CONSOLE] Failed to read Dokploy application:",
      response.status,
      text
    );

    throw new Error("Failed to read Dokploy application");
  }

  const data = (await response.json()) as DokployResponse;

  const possibleEnv =
    typeof data.env === "string"
      ? data.env
      : typeof data.environment === "string"
      ? data.environment
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
  const env = createEnvText(values);

  const response = await dokployRequest(
    "application.saveEnvironment",
    {
      method: "POST",
      body: JSON.stringify({
        applicationId,
        env,
        buildArgs: "",
        buildSecrets: "",
        createEnvFile: true,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();

    console.error(
      "[CONSOLE] Dokploy environment save failed:",
      response.status,
      text
    );

    throw new Error("Failed to save environment");
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
    const action = url.searchParams.get("action");

    /*
     * LOGS
     *
     * Example:
     * /api/console/INSTANCE_ID?action=logs
     */
    if (action === "logs") {
      const logsResponse = await dokployRequest(
        `application.readLogs?applicationId=${encodeURIComponent(
          instance.dokploy_application_id
        )}&tail=200&since=all`
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

      const logsData = (await logsResponse.json()) as DokployResponse;

      return NextResponse.json({
        logs: logsData,
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
    };

    const action = body.action;

    /*
     * START
     */
    if (action === "start") {
      const response = await dokployRequest(
        "application.start",
        {
          method: "POST",
          body: JSON.stringify({
            applicationId: instance.dokploy_application_id,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();

        console.error(
          "[CONSOLE] Dokploy start failed:",
          response.status,
          text
        );

        return NextResponse.json(
          { error: "Failed to start application" },
          { status: 502 }
        );
      }

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
    }

    /*
     * STOP
     */
    if (action === "stop") {
      const response = await dokployRequest(
        "application.stop",
        {
          method: "POST",
          body: JSON.stringify({
            applicationId: instance.dokploy_application_id,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();

        console.error(
          "[CONSOLE] Dokploy stop failed:",
          response.status,
          text
        );

        return NextResponse.json(
          { error: "Failed to stop application" },
          { status: 502 }
        );
      }

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
    }

    /*
     * SAVE ENVIRONMENT
     *
     * This updates the actual Dokploy application's environment
     * and asks Dokploy to create/update the .env file.
     */
    if (action === "save-env") {
      const currentEnv = await readApplicationEnvironment(
        instance.dokploy_application_id
      );

      const incomingEnv = body.env || {};

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

      await saveApplicationEnvironment(
        instance.dokploy_application_id,
        updatedEnv
      );

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
