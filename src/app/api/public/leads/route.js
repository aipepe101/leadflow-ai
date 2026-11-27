import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    // Honeypot: real visitors leave this hidden field empty.
    if (String(body.companyWebsite || "").trim()) {
      return NextResponse.json({ success: true });
    }

    const businessProfileId = String(body.businessProfileId || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().slice(0, 200);
    const phone = String(body.phone || "").trim().slice(0, 40);
    const notes = String(body.notes || "").trim().slice(0, 2000);

    if (!businessProfileId) {
      return NextResponse.json({ error: "This form is missing its business profile." }, { status: 400 });
    }
    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Please enter your name (120 characters max)." }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "Please provide an email address or phone number." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { id: true, userId: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "This lead form is no longer available." }, { status: 404 });
    }

    await prisma.lead.create({
      data: {
        userId: profile.userId,
        businessProfileId: profile.id,
        name,
        email: email || null,
        phone: phone || null,
        source: "Website",
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[PUBLIC_LEAD_CAPTURE]", error);
    return NextResponse.json({ error: "We couldn't send your request. Please try again." }, { status: 500 });
  }
}
