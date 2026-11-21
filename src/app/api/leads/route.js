import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const businessProfileId = searchParams.get("businessProfileId");
    const status = searchParams.get("status");

    const where = { userId: session.user.id };
    if (businessProfileId) where.businessProfileId = businessProfileId;
    if (status && status !== "ALL" && VALID_STATUSES.includes(status)) where.status = status;

    const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("[LEADS_GET]", error);
    return NextResponse.json({ error: "Unable to load leads." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = String(body.name || "").trim();
    const businessProfileId = String(body.businessProfileId || "").trim();
    if (!name || name.length > 120) return NextResponse.json({ error: "Name is required (120 characters max)." }, { status: 400 });
    if (!businessProfileId) return NextResponse.json({ error: "Choose a business profile." }, { status: 400 });

    const profile = await prisma.businessProfile.findFirst({
      where: { id: businessProfileId, userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Business profile not found." }, { status: 404 });

    const lead = await prisma.lead.create({
      data: {
        userId: session.user.id,
        businessProfileId,
        name,
        email: String(body.email || "").trim().slice(0, 200) || null,
        phone: String(body.phone || "").trim().slice(0, 40) || null,
        source: String(body.source || "Manual entry").trim().slice(0, 80) || "Manual entry",
        notes: String(body.notes || "").trim().slice(0, 2000) || null,
      },
    });
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("[LEADS_POST]", error);
    return NextResponse.json({ error: "Unable to create lead." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "Lead ID is required." }, { status: 400 });
    if (body.status && !VALID_STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid lead status." }, { status: 400 });

    const existing = await prisma.lead.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: String(body.notes).trim().slice(0, 2000) || null } : {}),
      },
    });
    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEADS_PATCH]", error);
    return NextResponse.json({ error: "Unable to update lead." }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Lead ID is required." }, { status: 400 });

    const existing = await prisma.lead.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LEADS_DELETE]", error);
    return NextResponse.json({ error: "Unable to delete lead." }, { status: 500 });
  }
}
