
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import ChatWidget from "@/components/chat/chatWidget";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "campusIQ | Sibsagar University",
  description:
    "Research Development Cell and Institution's Innovation Council, Sibsagar University",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("font-sans", geist.variable)}>
        <body className="font-sans antialiased bg-background text-foreground">
          <Providers>
            {/* <IntroGate
              buttonLabel="Inaugurate"
              once={false}
            >
              <Header />

              <main className="min-h-screen">
                {children}
              </main>

              <Footer />
            </IntroGate> */}
            <Header />

              <main className="min-h-screen">
                {children}
              </main>

              <Footer />
               <ChatWidget />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
