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