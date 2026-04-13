import type { Metadata } from "next";
import { Manrope, Audiowide } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const audiowide = Audiowide({
  variable: "--font-audiowide",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlexIQ v5.1 - Smart Media Management",
  description: "Intelligent Plex library management. One slider. No drama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={[manrope.variable, audiowide.variable, "h-full antialiased dark"].join(" ")}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100" style={{fontFamily: "var(--font-manrope), sans-serif"}}>
        {children}
      </body>
    </html>
  );
}
