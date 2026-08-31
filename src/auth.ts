import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      // Requests access to the user's guild (server) list so we can check
      // whether they're a member of your Discord server.
      authorization: { params: { scope: "identify email guilds" } },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      // Only allow sign-in if the user is a member of your Discord server.
      const requiredGuildId = process.env.DISCORD_GUILD_ID;
      if (!requiredGuildId || !account?.access_token) return true;

      try {
        const res = await fetch("https://discord.com/api/users/@me/guilds", {
          headers: { Authorization: `Bearer ${account.access_token}` },
        });
        const guilds: { id: string }[] = await res.json();
        const isMember = guilds.some((g) => g.id === requiredGuildId);
        return isMember; // false blocks sign-in
      } catch {
        return false;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
});