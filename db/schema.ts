import {
  pgTable,
  serial,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),

    // Future Meta integration
    metaLeadId: varchar("meta_lead_id", { length: 255 }),

    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),

    campaign: varchar("campaign", { length: 255 }),
    ad: varchar("ad", { length: 255 }),
    form: varchar("form", { length: 255 }),

    status: varchar("status", { length: 50 })
      .notNull()
      .default("new"),

    assignedTo: varchar("assigned_to", { length: 255 }).references(
      () => user.id,
      { onDelete: "set null" },
    ),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("leads_meta_lead_id_unique").on(table.metaLeadId),
    index("leads_status_idx").on(table.status),
    index("leads_assigned_to_idx").on(table.assignedTo),
    index("leads_created_at_idx").on(table.createdAt),
    index("leads_phone_idx").on(table.phone),
  ],
);
