import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Watch Shop POS",
  description: "Point of sale for watch repair and retail",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`} style={{ colorScheme: "light" }}>
      <body className="min-h-full font-sans antialiased">
        <AuthSessionProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
