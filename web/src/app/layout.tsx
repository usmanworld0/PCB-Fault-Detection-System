import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";

export const metadata: Metadata = {
  title: "PCB-Vision — Quality Inspection & Manufacturing QA",
  description: "Enterprise Automated PCB Fault Detection, Manufacturing QA & Defect Analytics Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface-50 text-surface-900 antialiased min-h-screen font-sans selection:bg-industrial-100 selection:text-industrial-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
