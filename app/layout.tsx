import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RPA Automatic | Agent OS",
  description: "Portal de agentes da RPA Automatic: orquestração, automação e revisão humana.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
