import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rifas e Inversiones La Calidosa | Rifa Anual 000-999",
  description: "Plataforma oficial de Rifas e Inversiones La Calidosa. Elige tu número del 000 al 999, abona tu cuota mensual y gestiona tu boleta con clave única hexadecimal.",
  icons: {
    icon: "/icon-calidosa.png",
    shortcut: "/icon-calidosa.png",
    apple: "/logo-calidosa.png",
  },
  openGraph: {
    title: "Rifas e Inversiones La Calidosa | Plan de Premios 2027",
    description: "Elige tu número de la suerte del 000 al 999 y abona tu cuota mensual de $100.000 COP.",
    images: ["/logo-calidosa.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
