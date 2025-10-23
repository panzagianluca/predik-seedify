import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/layout/CookieConsent";
import { BottomNav } from "@/components/layout/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Predik - El futuro tiene precio",
  description: "Opera mercados de predicción en la red de Celo, impulsados por Myriad Markets.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            <CookieConsentBanner />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 mb-16 md:mb-0">
                {/* mb-16 on mobile for bottom nav, md:mb-0 on desktop */}
                <div className="max-w-7xl mx-auto px-4 py-4">
                  {children}
                </div>
              </main>
              <Footer />
              {/* Mobile Bottom Navigation - Hidden on desktop */}
              <BottomNav />
            </div>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
