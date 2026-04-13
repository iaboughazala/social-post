import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "SocialPost - Schedule & Publish Content",
  description: "Schedule and publish content across social media platforms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
