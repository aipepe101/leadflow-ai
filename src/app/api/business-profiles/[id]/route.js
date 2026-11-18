import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.businessProfile.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    const data = {};
    for (const field of ["businessName", "serviceArea", "phone", "website", "description", "brandVoice"]) {
      if (body[field] !== undefined) data[field] = String(body[field]).trim().slice(0, field === "description" ? 1000 : 300);
    }
    if (body.services !== undefined) {
      data.services = Array.isArray(body.services)
        ? body.services.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
        : [];
    }
    if (body.businessName !== undefined && (!data.businessName || data.businessName.length > 100)) {
      return NextResponse.json({ error: "Enter a valid business name." }, { status: 400 });
    }
    const profile = await prisma.businessProfile.update({ where: { id }, data });
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[BUSINESS_PROFILE_PATCH]", error);
    return NextResponse.json({ error: "Unable to update business profile." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.businessProfile.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    await prisma.businessProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BUSINESS_PROFILE_DELETE]", error);
    return NextResponse.json({ error: "Unable to delete business profile." }, { status: 500 });
  }
}
