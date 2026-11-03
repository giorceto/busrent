import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/unbounded";
import "./globals.css";
import { SITE_URL } from "@/lib/util";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BusRent — автобуси и микробуси под наем в България",
    template: "%s | BusRent",
  },
  description:
    "Каталог на проверени превозвачи. Опиши пътуването веднъж и получи оферти само от превозвачи с подходящ автобус в твоя район.",
  openGraph: { siteName: "BusRent", locale: "bg_BG", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0e2a50" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
