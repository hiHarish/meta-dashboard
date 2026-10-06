import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    { error: "Webhook verification failed" },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log(
      "Meta webhook received:",
      JSON.stringify(body),
    );

    const entries = body?.entry;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { success: true },
        { status: 200 },
      );
    }

    for (const entry of entries) {
      const changes = entry?.changes;

      if (!Array.isArray(changes)) {
        continue;
      }

      for (const change of changes) {
        if (change?.field !== "leadgen") {
          continue;
        }

        const leadgenId = change?.value?.leadgen_id;

        if (!leadgenId) {
          console.error("Meta webhook: leadgen_id missing");
          continue;
        }

        if (!PAGE_ACCESS_TOKEN) {
          console.error(
            "META_PAGE_ACCESS_TOKEN is not configured",
          );
          continue;
        }

        console.log(
          "Fetching Meta lead:",
          leadgenId,
        );

        /*
         * Fetch actual lead information from Meta
         */
        const metaResponse = await fetch(
          `https://graph.facebook.com/v26.0/${leadgenId}?fields=id,created_time,field_data,form_id,ad_id,campaign_id&access_token=${encodeURIComponent(
            PAGE_ACCESS_TOKEN,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const metaData = await metaResponse.json();

        if (!metaResponse.ok) {
          console.error(
            "Meta Graph API error:",
            JSON.stringify(metaData),
          );
          continue;
        }

        console.log(
          "Meta lead data:",
          JSON.stringify(metaData),
        );

        /*
         * Prevent duplicate leads
         */
        const existingLead = await db
          .select({ id: leads.id })
          .from(leads)
          .where(eq(leads.metaLeadId, leadgenId))
          .limit(1);

        if (existingLead.length > 0) {
          console.log(
            "Meta lead already exists:",
            leadgenId,
          );
          continue;
        }

        /*
         * Convert Meta field_data into an easy object
         */
        const fieldData = Array.isArray(metaData.field_data)
          ? metaData.field_data
          : [];

        const fields: Record<string, string> = {};

        for (const field of fieldData) {
          if (
            field?.name &&
            Array.isArray(field?.values) &&
            field.values.length > 0
          ) {
            fields[field.name.toLowerCase()] =
              String(field.values[0] ?? "");
          }
        }

        /*
         * Common Meta form field names
         */
        const name =
          fields.full_name ||
          fields.name ||
          [fields.first_name, fields.last_name]
            .filter(Boolean)
            .join(" ");

        const phone =
          fields.phone_number ||
          fields.phone ||
          fields.mobile_number ||
          fields.mobile;

        const email =
          fields.email ||
          fields.email_address ||
          null;

        /*
         * Your database requires name + phone.
         */
        if (!name || !phone) {
          console.error(
            "Meta lead missing required name/phone:",
            {
              leadgenId,
              fields,
            },
          );

          continue;
        }

        /*
         * Insert into your existing leads table
         */
        await db.insert(leads).values({
          metaLeadId: leadgenId,
          name,
          phone,
          email,

          campaign: metaData.campaign_id
            ? String(metaData.campaign_id)
            : null,

          ad: metaData.ad_id
            ? String(metaData.ad_id)
            : null,

          form: metaData.form_id
            ? String(metaData.form_id)
            : null,

          status: "new",
        });

        console.log(
          "Meta lead inserted successfully:",
          leadgenId,
        );
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Meta webhook error:",
      error,
    );

    /*
     * Return 200 to Meta so a malformed/unexpected
     * event does not cause endless webhook retries.
     */
    return NextResponse.json(
      { success: false },
      { status: 200 },
    );
  }
}
