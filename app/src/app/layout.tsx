import type { Metadata } from "next";
import "../styles/globals.css";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata: Metadata = {
  title: "VoiceAI Outreach",
  description: "Cold outreach platform for Voice AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}