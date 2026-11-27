import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Profile ID is required." }, { status: 400 });

    const profile = await prisma.businessProfile.findUnique({
      where: { id },
      select: { id: true, businessName: true },
    });
    if (!profile) return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[PUBLIC_BUSINESS_PROFILE_GET]", error);
    return NextResponse.json({ error: "Unable to load this form." }, { status: 500 });
  }
}
