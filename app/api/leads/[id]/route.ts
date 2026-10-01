import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { getCurrentSession } from "@/lib/require-auth";

const updateLeadSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  phone: z.string().trim().min(7).max(30).optional(),

  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("")),

  campaign: z.string().trim().max(255).optional(),
  ad: z.string().trim().max(255).optional(),
  form: z.string().trim().max(255).optional(),

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

  assignedTo: z.string().nullable().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const leadId = Number(id);

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json(
        { error: "Invalid lead ID" },
        { status: 400 },
      );
    }

    const existing = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    const lead = existing[0];

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const validation = updateLeadSchema.safeParse(body);

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

    const role = session.user.role;

    if (role === "telecaller") {
      if (lead.assignedTo !== session.user.id) {
        return NextResponse.json(
          { error: "You cannot modify this lead" },
          { status: 403 },
        );
      }

      // Telecallers cannot reassign leads.
      if (data.assignedTo !== undefined) {
        return NextResponse.json(
          { error: "Telecallers cannot reassign leads" },
          { status: 403 },
        );
      }
    }

    if (
      role !== "admin" &&
      role !== "manager" &&
      role !== "telecaller"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const result = await db
      .update(leads)
      .set({
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.phone !== undefined && {
          phone: data.phone,
        }),

        ...(data.email !== undefined && {
          email: data.email || null,
        }),

        ...(data.campaign !== undefined && {
          campaign: data.campaign,
        }),

        ...(data.ad !== undefined && {
          ad: data.ad,
        }),

        ...(data.form !== undefined && {
          form: data.form,
        }),

        ...(data.status !== undefined && {
          status: data.status,
        }),

        ...(data.assignedTo !== undefined &&
          (role === "admin" || role === "manager") && {
            assignedTo: data.assignedTo,
          }),

        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("PATCH /api/leads/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Only Admin and Manager can delete
    if (
      session.user.role !== "admin" &&
      session.user.role !== "manager"
    ) {
      return NextResponse.json(
        { error: "You are not allowed to delete leads" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const leadId = Number(id);

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json(
        { error: "Invalid lead ID" },
        { status: 400 },
      );
    }

    const result = await db
      .delete(leads)
      .where(eq(leads.id, leadId))
      .returning({ id: leads.id });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      id: result[0].id,
    });
  } catch (error) {
    console.error("DELETE /api/leads/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 },
    );
  }
}