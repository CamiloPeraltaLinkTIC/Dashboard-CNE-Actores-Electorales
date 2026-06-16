import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Custos · Centro de Mando CNE / AE",
  description:
    "Dashboard unificado de inteligencia electoral — CNE y Actores Electorales en un solo centro de mando.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const vertical = cookieStore.get("vertical")?.value === "ae" ? "ae" : "cne";

  return (
    <html lang="es" data-vertical={vertical} className={inter.variable} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
