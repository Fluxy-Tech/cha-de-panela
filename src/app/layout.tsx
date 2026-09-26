import type { Metadata } from "next";
import { Alex_Brush, Geist_Mono, Raleway } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Raleway: fonte de títulos, subtítulos, descrições e botões.
const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const alexBrush = Alex_Brush({
  variable: "--font-alex-brush",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Chá de Panela",
  description: "Convite para o Chá de Panela",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${raleway.variable} ${geistMono.variable} ${alexBrush.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
