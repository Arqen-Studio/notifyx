import { ReactNode } from "react";
import { Bricolage_Grotesque, Archivo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Providers } from "@/components/providers";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "800"],
  display: "swap",
  variable: "--font-bricolage",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-archivo",
  preload: true,
  fallback: ["system-ui", "arial"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${archivo.className} ${bricolage.variable} bg-white dark:bg-black text-gray-800 dark:text-gray-200`}
        suppressHydrationWarning
      >
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
