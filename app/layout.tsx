import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "LUMINA",
  description: "Point of sale for LUMINA watch repair and retail",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${display.variable} h-full`} style={{ colorScheme: "light" }}>
      <body className="min-h-full font-sans antialiased">
        <AuthSessionProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
