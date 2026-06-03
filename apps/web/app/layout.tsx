import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CraveCompass",
  description: "Stop arguing. Start eating.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
