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