import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./prisma";
import { sendMail } from "./mailer";

const connection = new IORedis(process.env.REDIS_URL!);
export const sendQueue = new Queue("send-queue", { connection });

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