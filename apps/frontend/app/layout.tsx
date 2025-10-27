import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Header from "@/components/Header";
import { Poppins } from 'next/font/google';
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "QuickPoll - Real-Time Polling Platform",
  description: "Create polls, vote, and see live updates in real-time",
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={poppins.variable}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <body className="antialiased">
            <Header />
            {children}
            <Toaster position="bottom-right" />
          </body>
        </ThemeProvider>
      </html>
    </ClerkProvider>
  );
}
