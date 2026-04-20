import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    /**
     * Runs after a successful sign-in.
     * Upserts the user in MongoDB and attaches the DB _id to the token.
     */
    async signIn({ user }) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/upsert`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              image: user.image,
            }),
          }
        );
        if (!res.ok) return false;
        const dbUser = await res.json();
        // Store the MongoDB _id on the user object for the jwt callback
        (user as any).dbId = dbUser._id;
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Persist the MongoDB _id in the JWT so it survives page refreshes.
     */
    async jwt({ token, user }) {
      if (user) {
        token.dbId = (user as any).dbId;
      }
      return token;
    },

    /**
     * Expose the MongoDB _id on the client-side session.
     */
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.dbId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
