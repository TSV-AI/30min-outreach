import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransporter({
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