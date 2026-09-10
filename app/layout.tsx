import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./components/ui/ui.css";
import "./components/dashboard/dashboard.css";
import "./kalender/calendar.css";
import "./components/ui/modern.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "B&B Schadstoffsanierung",
    template: "%s | B&B Schadstoffsanierung",
  },
  description:
    "Digitale Baustellen- und Sicherheitsdokumentation der B&B Schadstoffsanierung.",
  icons: {
    icon: "/bb-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
