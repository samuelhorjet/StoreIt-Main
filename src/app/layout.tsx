import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import FaviconLoader from "@/Component/sections/FaviconLoader"; // Make sure this file exists

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "StoreIt",
  description: "StoreIt - The only storage solution you need.",
  icons: {
    icon: "/favicon.svg", // Main favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins antialiased`}>
        <FaviconLoader />
        {children}
      </body>
    </html>
  );
}
