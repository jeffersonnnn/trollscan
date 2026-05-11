import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TROLLSCAN - Memecoin Meta Tracker",
  description:
    "The Bloomberg terminal for Solana memecoins. Find the next pumping token before it pumps.",
  openGraph: {
    title: "TROLLSCAN",
    description: "Solana memecoin meta tracker with family detection and velocity scoring",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <div className="crt">{children}</div>
      </body>
    </html>
  );
}
