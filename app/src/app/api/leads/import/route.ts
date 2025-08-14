import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailValidator } from "@/lib/email-validator";

// Body: { records: {company, website?, phone?, address?, email, source?, rating?, reviews?, years_in_business?, google_guaranteed?, hours?, description?, services?}[] }
export async function POST(req: Request) {
  const { records } = await req.json();
  const created = [] as any[];
  const filtered = [] as any[];
  
  for (const r of records || []) {
    // Validate email before processing
    const emailValidation = EmailValidator.validateEmail(r.email);
    
    if (!emailValidation.shouldImport) {
      filtered.push({
        email: r.email,
        company: r.company,
        reason: emailValidation.reason
      });
      console.log(`🚫 Filtered out: ${r.email} - ${emailValidation.reason}`);
      continue;
    }

    const company = await prisma.company.upsert({
      where: { name: r.company },
      update: { 
        website: r.website ?? undefined, 
        phone: r.phone ?? undefined,
        address: r.address ?? undefined,
        hours: r.hours ?? undefined,
        description: r.description ?? undefined,
        services: r.services ? JSON.stringify(r.services) : undefined,
        rating: r.rating ?? undefined,
        reviews: r.reviews ?? undefined,
        yearsInBusiness: r.years_in_business ?? undefined,
        googleGuaranteed: r.google_guaranteed ?? undefined
      },
      create: { 
        name: r.company, 
        website: r.website ?? null, 
        phone: r.phone ?? null, 
        address: r.address ?? null,
        hours: r.hours ?? null,
        description: r.description ?? null,
        services: r.services ? JSON.stringify(r.services) : null,
        rating: r.rating ?? null,
        reviews: r.reviews ?? null,
        yearsInBusiness: r.years_in_business ?? null,
        googleGuaranteed: r.google_guaranteed ?? false
      },
    });
    
    const existing = await prisma.lead.findFirst({ where: { email: r.email.toLowerCase().trim() } });
    if (existing) {
      console.log(`⏭️  Skipped duplicate: ${r.email}`);
      continue;
    }
    
    const lead = await prisma.lead.create({
      data: { 
        companyId: company.id, 
        email: r.email.toLowerCase().trim(), 
        source: r.source || "import" 
      }
    });
    created.push(lead);
    console.log(`✅ Imported: ${r.email} from ${r.company}`);
  }
  
  console.log(`📊 Import Summary: ${created.length} imported, ${filtered.length} filtered out`);
  
  return NextResponse.json({ 
    ok: true, 
    count: created.length,
    filtered: filtered.length,
    filteredDetails: filtered
  });
}