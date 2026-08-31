import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify email guilds" } },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      const requiredGuildId = process.env.DISCORD_GUILD_ID;
      if (!requiredGuildId || !account?.access_token) return true;

      try {
        const res = await fetch("https://discord.com/api/users/@me/guilds", {
          headers: { Authorization: `Bearer ${account.access_token}` },
        });
        const guilds: { id: string }[] = await res.json();
        return guilds.some((g) => g.id === requiredGuildId);
      } catch {
        return false;
      }
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.discordId = profile.id as string;
        token.username = profile.username as string;
        token.globalName =
          (profile.global_name as string) ?? (profile.username as string);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.discordId as string;
        session.user.username = token.username as string;
        session.user.name = token.globalName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});