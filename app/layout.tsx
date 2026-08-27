import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Use Case Portfolio",
  description: "AI use case portfolio for NETSOL AI Labs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
