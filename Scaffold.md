VoiceAI Outreach Starter – Scraper + Next.js Dashboard

Lean starter to: (1) scrape practice emails, (2) run cold outreach sequences pitching your after‑hours Voice AI, (3) simple Next.js dashboard (shadcn/ui) to manage campaigns and sends, (4) pluggable scheduling tool hooks.

⸻

0) Stack & Features
	•	Scraper (Python) → JSONL of leads (company, email, phone, site)
	•	App (Next.js 14 / App Router, TS)
	•	DB: PostgreSQL + Prisma
	•	Queue: BullMQ (Redis) to schedule sequence steps
	•	Mailer: Nodemailer (SMTP)
	•	API: leads import, campaign CRUD, enroll, send worker, tracking (open/unsub)
	•	UI: shadcn/ui dashboard: Campaigns, Leads, Enrollments
	•	Scheduling hooks (stubs): Calendly, NexHealth, Jane, FlexBooker

Production notes: use a warmed sending domain + proper DNS (SPF/DKIM/DMARC), throttle sends, dedupe, and honor unsubscribes.

⸻

1) Directory Layout

voiceai-outreach/
├─ scraper/
│  └─ scrape_practices.py
├─ app/ (Next.js)
│  ├─ prisma/
│  │  └─ schema.prisma
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ page.tsx
│  │  │  ├─ campaigns/page.tsx
│  │  │  ├─ leads/page.tsx
│  │  │  ├─ enrollments/page.tsx
│  │  │  ├─ api/
│  │  │  │  ├─ leads/import/route.ts
│  │  │  │  ├─ campaigns/route.ts
│  │  │  │  ├─ enroll/route.ts
│  │  │  │  ├─ track/open/route.ts
│  │  │  │  ├─ track/unsub/route.ts
│  │  │  │  └─ send/tick/route.ts
│  │  ├─ components/
│  │  │  ├─ shell.tsx
│  │  │  ├─ data-table.tsx
│  │  │  └─ forms.tsx
│  │  ├─ lib/
│  │  │  ├─ prisma.ts
│  │  │  ├─ mailer.ts
│  │  │  ├─ queue.ts
│  │  │  ├─ templates.ts
│  │  │  └─ schedulers.ts
│  │  └─ styles/
│  │     └─ globals.css
│  ├─ package.json
│  ├─ next.config.mjs
│  ├─ postcss.config.js
│  ├─ tailwind.config.ts
│  └─ .env.example


⸻

2) Environment

app/.env.example

DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres?schema=public"
REDIS_URL="redis://localhost:6379"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=REPLACE_ME
FROM_EMAIL="Ava at Three Sixty Vue <ava@yourdomain.com>"
BASE_URL="http://localhost:3000"


⸻

3) Prisma Schema

app/prisma/schema.prisma

datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model Company {
  id        String   @id @default(cuid())
  name      String
  website   String?
  phone     String?
  address   String?
  city      String?
  state     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  leads     Lead[]
}

model Lead {
  id           String     @id @default(cuid())
  companyId    String
  company      Company    @relation(fields: [companyId], references: [id])
  contactName  String?
  role         String?
  email        String
  source       String
  status       LeadStatus @default(NEW)
  unsubscribed Boolean    @default(false)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  emails       OutboundEmail[]
  enrollments  Enrollment[]
}

enum LeadStatus { NEW QUEUED CONTACTED REPLIED BOUNCED UNSUBSCRIBED }

model Campaign {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  niche     String?
  city      String?
  state     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  steps     SequenceStep[]
}

model SequenceStep {
  id          String   @id @default(cuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  dayOffset   Int
  subject     String
  bodyHtml    String
}

model Enrollment {
  id         String   @id @default(cuid())
  leadId     String
  lead       Lead     @relation(fields: [leadId], references: [id])
  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id])
  startDate  DateTime @default(now())
}

model OutboundEmail {
  id         String     @id @default(cuid())
  leadId     String
  lead       Lead       @relation(fields: [leadId], references: [id])
  campaignId String?
  stepId     String?
  sentAt     DateTime?
  status     EmailStatus @default(PENDING)
  messageId  String?
  subject    String
  bodyHtml   String
  trackId    String     @unique
}

enum EmailStatus { PENDING SENT BOUNCED FAILED OPENED REPLIED UNSUBSCRIBED }


⸻

4) Scraper (Python)

scraper/scrape_practices.py

import os, re, json, time
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)

# ---- helpers ----

def serpapi_gmaps(query, location, num=20):
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps", "type": "search",
        "q": query, "location": location, "api_key": SERPAPI_KEY
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    results = []
    for item in data.get("local_results", [])[:num]:
        results.append({
            "name": item.get("title"),
            "website": item.get("website"),
            "phone": item.get("phone"),
            "address": item.get("address")
        })
    return results

VISIT_HINTS = ["/contact", "/contact-us", "/about", "/appointments", "/locations"]


def fetch(url):
    try:
        r = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        if r.ok:
            return r.text
    except Exception:
        return None
    return None


def harvest_emails(site):
    emails = set(EMAIL_RE.findall(site or ""))
    return {e.lower() for e in emails if not e.lower().endswith((".png", ".jpg"))}


def crawl_site(base_url):
    pages = set()
    html = fetch(base_url)
    if html:
        pages.add(html)
    for hint in VISIT_HINTS:
        sub = urljoin(base_url, hint)
        html = fetch(sub)
        if html:
            pages.add(html)
            time.sleep(1)
    found = set()
    for page in pages:
        found |= harvest_emails(page)
    return list(found)


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", default="dentist")
    ap.add_argument("--location", default="San Diego, CA")
    ap.add_argument("--limit", type=int, default=30)
    ap.add_argument("--out", default="leads.jsonl")
    args = ap.parse_args()

    practices = serpapi_gmaps(args.query, args.location, num=args.limit)
    with open(args.out, "w") as f:
        for p in practices:
            site = p.get("website")
            emails = crawl_site(site) if site else []
            for e in emails:
                rec = {
                    "company": p.get("name"),
                    "website": site,
                    "phone": p.get("phone"),
                    "address": p.get("address"),
                    "email": e,
                    "source": "scraper:serpapi"
                }
                f.write(json.dumps(rec) + "\n")
    print(f"Wrote {args.out}")

if __name__ == "__main__":
    main()

Usage: SERPAPI_KEY=... python scrape_practices.py --query "dentist" --location "Phoenix, AZ" --limit 50 → leads.jsonl.

⸻

5) Next.js App – Package + Config

app/package.json

{
  "name": "voiceai-outreach",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "prisma": "prisma",
    "migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^5.15.0",
    "bullmq": "^5.7.6",
    "date-fns": "^3.6.0",
    "ioredis": "^5.4.1",
    "nanoid": "^5.0.7",
    "next": "14.2.5",
    "nodemailer": "^6.9.14",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "slugify": "^1.6.6",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "prisma": "^5.15.0",
    "typescript": "^5.5.4"
  }
}

app/next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = { experimental: { typedRoutes: true } };
export default nextConfig;


⸻

6) Libs (Prisma, Mailer, Queue, Templates, Schedulers)

app/src/lib/prisma.ts

import { PrismaClient } from "@prisma/client";
const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

app/src/lib/mailer.ts

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string; }) {
  return transporter.sendMail({
    from: process.env.FROM_EMAIL!, to, subject, html,
  });
}

app/src/lib/queue.ts

import { Queue, QueueScheduler, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./prisma";
import { sendMail } from "./mailer";

const connection = new IORedis(process.env.REDIS_URL!);
export const sendQueue = new Queue("send-queue", { connection });
new QueueScheduler("send-queue", { connection });

export type SendJob = { outboundEmailId: string };

export function enqueueSend(outboundEmailId: string, opts: JobsOptions = {}) {
  return sendQueue.add("send", { outboundEmailId }, opts);
}

// Worker executes the actual send
export const worker = new Worker<SendJob>(
  "send-queue",
  async (job) => {
    const oe = await prisma.outboundEmail.findUnique({ where: { id: job.data.outboundEmailId }, include: { lead: true } });
    if (!oe || !oe.lead || oe.lead.unsubscribed) return;
    const html = oe.bodyHtml;
    const res = await sendMail({ to: oe.lead.email, subject: oe.subject, html });
    await prisma.outboundEmail.update({ where: { id: oe.id }, data: { status: "SENT", sentAt: new Date(), messageId: (res as any).messageId } });
  },
  { connection }
);

app/src/lib/templates.ts

// very simple merge, expand as needed
export function render(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

// default dental cold email sequence
export const DEFAULT_STEPS = [
  {
    dayOffset: 0,
    subject: "After-hours calls → booked appointments (hands-off)",
    bodyHtml: `Hi {{firstname}},<br/><br/>
We build a Voice AI that answers after-hours calls like a trained receptionist — quoting prices, reading your calendar, and booking directly into {{scheduler}}. It references your practice data (hours, insurances, pricing, procedures) and avoids missed opportunities.<br/><br/>
If we routed tonight’s calls for {{company}}, how many would you want converted to appointments?<br/><br/>
— Ava · Three Sixty Vue<br/>
<small><a href="{{unsub}}">Unsubscribe</a></small>`
  },
  {
    dayOffset: 2,
    subject: "{{company}}’s missed calls last weekend",
    bodyHtml: `Quick one: most dental practices miss 20–40% of after-hours calls. We turn those into next-day bookings with insurance capture and reminders. Want a 10‑min demo with your own pricing and calendar? <br/><br/>
— Ava<br/>
<small><a href="{{unsub}}">Unsubscribe</a></small>`
  },
  {
    dayOffset: 5,
    subject: "Free pilot this week?",
    bodyHtml: `We can stand up a sandbox that reads {{company}}’s hours and availability, then simulate weekend calls. If it doesn’t impress, you owe nothing.<br/><br/>
— Ava<br/>
<small><a href="{{unsub}}">Unsubscribe</a></small>`
  }
];

app/src/lib/schedulers.ts

// Stubs for scheduling providers (wire real APIs later)
export type SchedulerProvider = "calendly" | "nexhealth" | "jane" | "flexbooker" | "custom";

export function getSchedulerLink(provider: SchedulerProvider, idOrUrl?: string) {
  if (!idOrUrl) return "https://calendly.com/your-link"; // default demo
  return idOrUrl; // for now, treat as URL
}


⸻

7) API Routes

Import Leads – POST /api/leads/import

app/src/app/api/leads/import/route.ts

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

Campaigns – POST /api/campaigns (create default steps), GET /api/campaigns

app/src/app/api/campaigns/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";
import { DEFAULT_STEPS } from "@/lib/templates";

export async function GET() {
  const items = await prisma.campaign.findMany({ include: { steps: true } });
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

Enroll Leads – POST /api/enroll

app/src/app/api/enroll/route.ts

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

Open Tracking Pixel – GET /api/track/open?tid=...

app/src/app/api/track/open/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tid = searchParams.get("tid");
  if (tid) {
    const oe = await prisma.outboundEmail.findFirst({ where: { trackId: tid } });
    if (oe) await prisma.outboundEmail.update({ where: { id: oe.id }, data: { status: "OPENED" } });
  }
  // tiny 1x1 gif
  const buf = Buffer.from("R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");
  return new NextResponse(buf, { headers: { "Content-Type": "image/gif" } });
}

Unsubscribe – GET /api/track/unsub?e=...

app/src/app/api/track/unsub/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("e");
  if (email) {
    await prisma.lead.updateMany({ where: { email }, data: { unsubscribed: true, status: "UNSUBSCRIBED" } });
  }
  return NextResponse.json({ ok: true, message: "You are unsubscribed." });
}

Tick Sender – optional manual trigger POST /api/send/tick (generates future steps based on day offsets)

app/src/app/api/send/tick/route.ts

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


⸻

8) UI (shadcn/ui only)

app/src/components/shell.tsx

import { ReactNode } from "react";
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">VoiceAI Outreach</h1>
        {children}
      </div>
    </div>
  );
}

app/src/components/forms.tsx

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function NewCampaignForm() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Input placeholder="Campaign name" value={name} onChange={e=>setName(e.target.value)} />
      <Button disabled={busy} onClick={async()=>{
        setBusy(true);
        await fetch("/api/campaigns", { method: "POST", body: JSON.stringify({ name }), headers: { "Content-Type":"application/json" }});
        location.reload();
      }}>Create</Button>
    </div>
  );
}

export function ImportLeadsForm() {
  const [jsonl, setJsonl] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Textarea rows={6} placeholder='Paste JSONL or JSON array' value={jsonl} onChange={e=>setJsonl(e.target.value)} />
      <Button disabled={busy} onClick={async()=>{
        setBusy(true);
        let records:any[]=[];
        try {
          if (jsonl.trim().startsWith("[")) records = JSON.parse(jsonl);
          else records = jsonl.split(/\n+/).filter(Boolean).map(line=>JSON.parse(line));
        } catch(e) { alert("Invalid JSON/JSONL"); setBusy(false); return; }
        await fetch("/api/leads/import", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ records })});
        location.reload();
      }}>Import</Button>
    </div>
  );
}

app/src/app/page.tsx

import Shell from "@/components/shell";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <Shell>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/campaigns"><Button className="w-full">Campaigns</Button></Link>
        <Link href="/leads"><Button className="w-full">Leads</Button></Link>
        <Link href="/enrollments"><Button className="w-full">Enrollments</Button></Link>
      </div>
    </Shell>
  );
}

app/src/app/campaigns/page.tsx

import Shell from "@/components/shell";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { NewCampaignForm } from "@/components/forms";

export default async function Page() {
  const items = await prisma.campaign.findMany({ include: { steps: true } });
  return (
    <Shell>
      <div className="space-y-4">
        <Card className="p-4 space-y-2">
          <h2 className="text-lg font-semibold">Create Campaign</h2>
          <NewCampaignForm />
        </Card>
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map(c=> (
            <Card key={c.id} className="p-4">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm opacity-70">{c.steps.length} steps</div>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}

app/src/app/leads/page.tsx

import Shell from "@/components/shell";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ImportLeadsForm } from "@/components/forms";

export default async function Page() {
  const leads = await prisma.lead.findMany({ include: { company: true } });
  return (
    <Shell>
      <div className="space-y-4">
        <Card className="p-4 space-y-2">
          <h2 className="text-lg font-semibold">Import Leads</h2>
          <ImportLeadsForm />
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Leads ({leads.length})</h3>
          <div className="text-sm grid gap-1">
            {leads.map(l=> (
              <div key={l.id} className="flex justify-between border-b border-white/10 py-1">
                <div>
                  <div>{l.company.name}</div>
                  <div className="opacity-70">{l.email}</div>
                </div>
                <div className="opacity-70">{l.status}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

app/src/app/enrollments/page.tsx

import Shell from "@/components/shell";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const [leads, camps] = await Promise.all([
    prisma.lead.findMany({ include: { company: true } }),
    prisma.campaign.findMany()
  ]);

  async function enroll(formData: FormData) {
    "use server";
    const leadIds = formData.getAll("leadId");
    const campaignId = String(formData.get("campaignId")||"");
    await fetch("/api/enroll", { method: "POST", body: JSON.stringify({ leadIds, campaignId }), headers: {"Content-Type":"application/json"} });
  }

  async function tick() {
    "use server";
    await fetch("/api/send/tick", { method: "POST" });
  }

  return (
    <Shell>
      <div className="space-y-4">
        <Card className="p-4 space-y-2">
          <h2 className="text-lg font-semibold">Enroll Leads</h2>
          <form action={enroll} className="space-y-2">
            <select name="campaignId" className="bg-neutral-900 p-2 rounded">
              {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="max-h-64 overflow-auto border border-white/10 rounded p-2">
              {leads.map(l=> (
                <label key={l.id} className="flex items-center gap-2 py-1">
                  <input type="checkbox" name="leadId" value={l.id} />
                  <span className="text-sm">{l.company.name} – {l.email}</span>
                </label>
              ))}
            </div>
            <Button type="submit">Enroll</Button>
          </form>
        </Card>
        <Card className="p-4 space-y-2">
          <h2 className="text-lg font-semibold">Send Tick</h2>
          <form action={tick}><Button type="submit">Generate & Queue Due Steps</Button></form>
        </Card>
      </div>
    </Shell>
  );
}


⸻

9) Tailwind + shadcn minimal

app/tailwind.config.ts

import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;

app/src/styles/globals.css

@tailwind base;
@tailwind components;
@tailwind utilities;
:root { color-scheme: dark; }


⸻

10) Running Locally

# services
docker run -d --name pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
docker run -d --name redis -p 6379:6379 redis:7

# app
cd app
cp .env.example .env.local
pnpm install
pnpm prisma migrate dev --name init
pnpm dev

# in another terminal: keep queue worker alive (auto-imported by lib/queue)
# (Next process will load worker upon import; for prod, run a separate worker process)

# scraper
cd ../scraper
pip install requests beautifulsoup4
SERPAPI_KEY=... python scrape_practices.py --query "dentist" --location "Dallas, TX" --limit 50

# import leads (UI → Leads → Import) or via curl:
curl -X POST http://localhost:3000/api/leads/import \
  -H 'Content-Type: application/json' \
  -d '{"records": [{"company":"Bright Dental","email":"info@brightdental.com","source":"scraper","website":"https://brightdental.com"}]}'


⸻

11) Extending – Scheduling “Tools” (MCP-friendly shape)

Create a provider that returns availability + booking link.

// example shape to later swap with MCP/tool servers
export type Availability = { start: string; end: string; slots: { start: string; end: string }[] };
export interface SchedulerTool {
  name: string;
  getAvailability(practiceId: string): Promise<Availability>;
  book(practiceId: string, slot: { start: string; end: string }, patient: { name: string; phone: string }): Promise<{ confirmationId: string }>;
}

Wire your Voice AI to call this tool during calls; emails can embed book now links.

⸻

12) Compliance & Deliverability (non-negotiables)
	•	Use a separate sending domain (SPF/DKIM/DMARC aligned). Warm slowly.
	•	Always include unsubscribe and honor it in DB.
	•	Respect directory/website ToS and anti‑scraping rules; consider official APIs or purchased data for scale.
	•	Rate limit sends. Start at 20–40/day/sender.

⸻

13) Test Data Snippets

JSONL line (for Import):

{"company":"Green Valley Dental","website":"https://gv-dental.com","phone":"(555) 222-9911","address":"123 Main St, Austin, TX","email":"frontdesk@gv-dental.com","source":"scraper:serpapi"}

Enroll request (if calling API directly):

{"leadIds":["LEAD_ID_1"],"campaignId":"CAMPAIGN_ID"}


⸻

14) What’s intentionally stubbed (so you can slot your stack)
	•	OAuth/Users/multi-tenant auth
	•	Bounce/reply webhooks (connect via provider API)
	•	Real scheduling APIs (replace schedulers.ts)
	•	Advanced personalization & sequence logic
	•	Full email warmup/rotation/sendingpool

This gets you from zero → working outreach with a clean upgrade path for your Voice AI + scheduling. Ship it, then iterate.