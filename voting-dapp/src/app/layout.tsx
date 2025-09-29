import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FHEVM Voting DApp",
  description: "Privacy-preserving voting system built with FHEVM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🔐 FHEVM Voting DApp
            </h1>
            <p className="text-lg text-gray-600">
              Privacy-preserving voting with Fully Homomorphic Encryption
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}