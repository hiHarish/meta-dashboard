import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import {
  ac,
  admin,
  manager,
  telecaller,
} from "@/lib/permissions";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  plugins: [
    adminClient({
      ac,
      roles: {
        admin,
        manager,
        telecaller,
      },
    }),
  ],
});