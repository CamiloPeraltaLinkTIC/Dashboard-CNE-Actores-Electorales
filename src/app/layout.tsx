import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { isVerticalId, DEFAULT_VERTICAL } from "@/lib/verticals";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Centro de Mando Unificado CNE - AE",
  description:
    "Dashboard unificado de inteligencia electoral — CNE y Actores Electorales en un solo centro de mando.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const vCookie = cookieStore.get("vertical")?.value;
  const vertical = isVerticalId(vCookie) ? vCookie : DEFAULT_VERTICAL;

  return (
    <html lang="es" data-vertical={vertical} className={inter.variable} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
