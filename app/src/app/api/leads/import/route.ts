import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Body: { records: {company, website?, phone?, address?, email, source?}[] }
export async function POST(req: Request) {
  const { records } = await req.json();
  const created = [] as any[];
  for (const r of records || []) {
    const company = await prisma.company.upsert({
      where: { name: r.company },
      update: { website: r.website ?? undefined, phone: r.phone ?? undefined },
      create: { name: r.company, website: r.website ?? null, phone: r.phone ?? null, address: r.address ?? null },
    });
    const existing = await prisma.lead.findFirst({ where: { email: r.email } });
    if (existing) continue;
    const lead = await prisma.lead.create({
      data: { companyId: company.id, email: r.email, source: r.source || "import" }
    });
    created.push(lead);
  }
  return NextResponse.json({ ok: true, count: created.length });
}