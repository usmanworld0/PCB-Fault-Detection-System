import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";

export const metadata: Metadata = {
  title: "PCB-Vision",
  description: "Enterprise Automated PCB Fault Detection, Manufacturing QA & Defect Analytics Platform",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8F9FA] text-[#2D3748] antialiased min-h-screen font-sans selection:bg-[#4FD1C5]/20 selection:text-[#319795]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
