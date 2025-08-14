import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";
import { DEFAULT_STEPS } from "@/lib/templates";

export async function GET() {
  const items = await prisma.campaign.findMany({ 
    include: { 
      steps: true,
      enrollments: {
        include: { lead: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name: string = body.name;
  const slug = slugify(name, { lower: true, strict: true });
  const campaign = await prisma.campaign.create({ data: { name, slug, niche: body.niche || null, city: body.city || null, state: body.state || null } });
  for (const s of DEFAULT_STEPS) {
    await prisma.sequenceStep.create({ data: { campaignId: campaign.id, dayOffset: s.dayOffset, subject: s.subject, bodyHtml: s.bodyHtml } });
  }
  const out = await prisma.campaign.findUnique({ where: { id: campaign.id }, include: { steps: true } });
  return NextResponse.json(out);
}