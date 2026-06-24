import type { Metadata } from "next";
import "./globals.css";
import ThemeInit from "@/components/ThemeInit";

export const metadata: Metadata = {
  title: "Flow",
  description: "Трекер задач для вашей команды",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <body className="h-full antialiased">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
