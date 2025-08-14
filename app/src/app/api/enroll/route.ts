import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueSend } from "@/lib/queue";
import { render } from "@/lib/templates";

export async function POST(req: Request) {
  const { leadIds, campaignId } = await req.json();
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { steps: true } });
  if (!campaign) return NextResponse.json({ ok: false }, { status: 404 });

  for (const id of leadIds as string[]) {
    await prisma.enrollment.create({ data: { leadId: id, campaignId } });
    // create OutboundEmail for step0 and enqueue
    const lead = await prisma.lead.findUnique({ where: { id }, include: { company: true } });
    if (!lead) continue;
    const vars = {
      firstname: (lead.contactName?.split(" ")[0]) || "there",
      company: lead.company.name,
      scheduler: "Calendly", // replace with real
      unsub: `${process.env.BASE_URL}/api/track/unsub?e=${encodeURIComponent(lead.email)}`
    };
    const step0 = campaign.steps.find(s => s.dayOffset === 0) || campaign.steps[0];
    const html = render(step0.bodyHtml, vars);
    const oe = await prisma.outboundEmail.create({ data: {
      leadId: id, campaignId, stepId: step0.id,
      subject: render(step0.subject, vars),
      bodyHtml: html,
      trackId: crypto.randomUUID()
    }});
    await enqueueSend(oe.id, { delay: 1000 });
  }

  return NextResponse.json({ ok: true });
}