import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INDUSTRIES = ["plumbing", "mobile-detailing"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(profiles);
  } catch (error) {
    console.error("[BUSINESS_PROFILES_GET]", error);
    return NextResponse.json({ error: "Unable to load business profiles." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const businessName = String(body.businessName || "").trim();
    const industry = String(body.industry || "").trim();
    if (!businessName || businessName.length > 100) {
      return NextResponse.json({ error: "Enter a business name (100 characters or fewer)." }, { status: 400 });
    }
    if (!INDUSTRIES.includes(industry)) {
      return NextResponse.json({ error: "Choose Plumbing or Mobile Detailing." }, { status: 400 });
    }
    const services = Array.isArray(body.services)
      ? body.services.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
      : [];
    const profile = await prisma.businessProfile.create({
      data: {
        userId: session.user.id,
        businessName,
        industry,
        services,
        serviceArea: String(body.serviceArea || "").trim().slice(0, 160) || null,
        phone: String(body.phone || "").trim().slice(0, 40) || null,
        website: String(body.website || "").trim().slice(0, 200) || null,
        description: String(body.description || "").trim().slice(0, 1000) || null,
        brandVoice: String(body.brandVoice || "").trim().slice(0, 300) || null,
      },
    });
    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("[BUSINESS_PROFILES_POST]", error);
    return NextResponse.json({ error: "Unable to create business profile." }, { status: 500 });
  }
}
