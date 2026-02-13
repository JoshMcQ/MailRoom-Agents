import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailRoom Agents - AI-Powered Mailbox Management",
  description: "Multi-tenant SaaS where policy-controlled AI agents manage shared mailboxes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
