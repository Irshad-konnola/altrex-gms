import type { Metadata } from "next";
import {  Outfit } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});
export const metadata: Metadata = {
  title: "Altrex GMS | Gym Management System",
  description: "AI-assisted operating system for Altrex Fitness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} bg-dark-900 text-dark-50 antialiased`}>
        <QueryProvider>
        {children}
        <Toaster theme="dark" position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}