import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import SWRProvider from "@/components/SWRProvider";
import LayoutNav from "@/components/LayoutNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Piss",
  description: "Track your piss",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Piss",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <SWRProvider>
          <AuthProvider>
            <LayoutNav />
            <main className="flex-1">
              {children}
            </main>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
