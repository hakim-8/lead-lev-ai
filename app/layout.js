import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata = {
  title: "Lead Lev AI",
  description: "Find, Verify, and Contact Leads with Superhuman AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${geistSans.variable}`}>
      <ClerkProvider>
        <body className="min-h-full flex flex-col font-sans antialiased">{children}</body>
      </ClerkProvider>
    </html>
  );
}
