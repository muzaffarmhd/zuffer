import type { Metadata } from "next";
import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zuffer - Custom Event Bot Builder",
  description: "A custom bot builder for your organization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#000319]`}
      >
        <ToastProvider>
        {children}
        </ToastProvider>
      </body>
    </html>
  );
}
