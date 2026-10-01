import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { getCurrentSession } from "@/lib/require-auth";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(7).max(30),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("")),

  campaign: z.string().trim().max(255).optional().or(z.literal("")),
  ad: z.string().trim().max(255).optional().or(z.literal("")),
  form: z.string().trim().max(255).optional().or(z.literal("")),

  status: z
    .enum([
      "new",
      "contacted",
      "interested",
      "follow_up",
      "converted",
      "not_interested",
      "invalid",
    ])
    .optional(),

  assignedTo: z.string().min(1).nullable().optional(),

  metaLeadId: z.string().max(255).optional().or(z.literal("")),
});

const allowedStatuses = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "converted",
  "not_interested",
  "invalid",
] as const;

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const role = session.user.role;

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      Number(searchParams.get("page") || "1"),
      1,
    );

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || "20"), 1),
      100,
    );

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const offset = (page - 1) * limit;

    const conditions = [];

    if (role === "telecaller") {
      conditions.push(eq(leads.assignedTo, session.user.id));
    }

    if (status && allowedStatuses.includes(status as never)) {
      conditions.push(eq(leads.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(leads.name, `%${search}%`),
          ilike(leads.phone, `%${search}%`),
          ilike(leads.email, `%${search}%`),
          ilike(leads.campaign, `%${search}%`),
        ),
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      leads: result,
      page,
      limit,
      count: result.length,
    });
  } catch (error) {
    console.error("GET /api/leads error:", error);

    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      session.user.role !== "admin" &&
      session.user.role !== "manager"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const validation = leadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid lead data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    const result = await db
      .insert(leads)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        campaign: data.campaign || null,
        ad: data.ad || null,
        form: data.form || null,
        status: data.status || "new",
        assignedTo: data.assignedTo || null,
        metaLeadId: data.metaLeadId || null,
      })
      .returning();

    return NextResponse.json(result[0], {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/leads error:", error);

    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 },
    );
  }
}