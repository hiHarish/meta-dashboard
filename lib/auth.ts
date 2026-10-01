import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import {
  ac,
  admin,
  manager,
  telecaller,
} from "@/lib/permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },

  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        manager,
        telecaller,
      },
      adminRoles: ["admin"],
    }),
  ],
});