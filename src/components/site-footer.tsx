import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import iconeGirassol from "@/app/assets/IconeBotaoDeAberturaDoEnvelope.png";

// Rodapé das telas públicas, com a mesma cor do header.
export function SiteFooter() {
  return (
    <footer className="bg-[#4A3F35] px-6 py-8 text-yellow-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <div className="flex items-center gap-2">
            <span className="font-signature text-2xl leading-none">Gabriel</span>
            <Image src={iconeGirassol} alt="" aria-hidden className="size-5" />
            <span className="font-signature text-2xl leading-none">
              Gabrielle
            </span>
          </div>
          <p className="text-sm text-yellow-50/70">© 2026 Gabriel Lopes.</p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-yellow-50/60 px-4 text-sm font-semibold text-yellow-50 transition-colors hover:bg-yellow-50 hover:text-[#4A3F35]"
        >
          <LayoutDashboard aria-hidden className="size-4" />
          Acessar dashboard
        </Link>
      </div>
    </footer>
  );
}
