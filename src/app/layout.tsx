import type { Metadata } from "next";
import {  Outfit } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: {
    template: "%s | Altrex GMS",
    default: "Altrex GMS | Modern Gym Management System",
  },
  description: "Advanced AI-assisted operating system for Altrex Fitness. Manage members, attendance, payments, and WhatsApp automation.",
  applicationName: "Altrex GMS",
  authors: [{ name: "Irshad Konnola" }],
  keywords: ["Gym Management", "Fitness", "Attendance", "Payments", "WhatsApp Automation"],
  openGraph: {
    title: "Altrex GMS",
    description: "Modern Gym Management System for Altrex Fitness",
    url: "https://altrex-gms.vercel.app",
    siteName: "Altrex GMS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Altrex GMS Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Altrex GMS",
    description: "Modern Gym Management System for Altrex Fitness",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" }
    ],
    apple: [
      { url: "/logo.png" }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} bg-background text-foreground antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}