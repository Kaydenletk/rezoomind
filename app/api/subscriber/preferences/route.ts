import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// GET - Fetch subscriber preferences by token
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Token is required" },
      { status: 400 }
    );
  }

  try {
    const subscriber = await prisma.email_subscribers.findUnique({
      where: { preferences_token: token },
      select: {
        email: true,
        status: true,
        interested_roles: true,
        preferred_locations: true,
        keywords: true,
        weekly_limit: true,
      },
    });

    if (!subscriber) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 404 }
      );
    }

    if (subscriber.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Please confirm your email subscription first" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      preferences: {
        email: subscriber.email,
        roles: subscriber.interested_roles,
        locations: subscriber.preferred_locations,
        keywords: subscriber.keywords,
        weeklyLimit: subscriber.weekly_limit,
      },
    });
  } catch (error) {
    console.error("[subscriber/preferences GET] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT - Update subscriber preferences by token
const updateSchema = z.object({
  roles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Token is required" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    // Verify token exists and subscriber is active
    const subscriber = await prisma.email_subscribers.findUnique({
      where: { preferences_token: token },
      select: { id: true, status: true },
    });

    if (!subscriber) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 404 }
      );
    }

    if (subscriber.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Please confirm your email subscription first" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: {
      interested_roles?: string[];
      preferred_locations?: string[];
      keywords?: string[];
    } = {};

    if (parsed.data.roles !== undefined) {
      updateData.interested_roles = parsed.data.roles;
    }
    if (parsed.data.locations !== undefined) {
      updateData.preferred_locations = parsed.data.locations;
    }
    if (parsed.data.keywords !== undefined) {
      updateData.keywords = parsed.data.keywords;
    }

    // Update subscriber preferences
    await prisma.email_subscribers.update({
      where: { preferences_token: token },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("[subscriber/preferences PUT] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
