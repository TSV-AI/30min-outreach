import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueSend } from "@/lib/queue";
import { render } from "@/lib/templates";

export async function POST() {
  const enrollments = await prisma.enrollment.findMany({ include: { campaign: { include: { steps: true } }, lead: { include: { company: true } } } });
  const now = new Date();
  let created = 0;
  for (const en of enrollments) {
    for (const step of en.campaign.steps) {
      const due = new Date(en.startDate.getTime());
      due.setDate(due.getDate() + step.dayOffset);
      const already = await prisma.outboundEmail.findFirst({ where: { leadId: en.leadId, stepId: step.id } });
      if (!already && due <= now) {
        const vars = {
          firstname: (en.lead.contactName?.split(" ")[0]) || "there",
          company: en.lead.company.name,
          scheduler: "Calendly",
          unsub: `${process.env.BASE_URL}/api/track/unsub?e=${encodeURIComponent(en.lead.email)}`
        };
        const oe = await prisma.outboundEmail.create({ data: {
          leadId: en.leadId, campaignId: en.campaignId, stepId: step.id,
          subject: render(step.subject, vars),
          bodyHtml: render(step.bodyHtml, vars),
          trackId: crypto.randomUUID()
        }});
        await enqueueSend(oe.id, { delay: 500 });
        created++;
      }
    }
  }
  return NextResponse.json({ ok: true, created });
}