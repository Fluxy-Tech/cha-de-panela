import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Wine } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId } from "@/lib/family-session";

export default async function InvitePage() {
  const familyId = await getSessionFamilyId();
  if (!familyId) redirect("/invitations");

  // O convite só fica disponível depois de pelo menos uma contribuição paga.
  const confirmedPayment = await prisma.payment.findFirst({
    where: { familyId, status: "CONFIRMED" },
    select: { id: true },
  });
  if (!confirmedPayment) redirect("/invitations");

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#FDFCF7] px-4 pb-20 pt-36 sm:pt-40">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Link
          href="/invitations"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#8B7355] transition-colors hover:text-[#4A3F35]"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para a lista de presentes
        </Link>

        <article className="flex flex-col items-center gap-6 rounded-2xl bg-white px-6 py-10 text-center shadow-card sm:px-12">
          <Image
            src="/Girassois.png"
            alt=""
            aria-hidden
            width={1536}
            height={1024}
            loading="eager"
            className="w-48 select-none sm:w-56"
          />

          <h1 className="font-signature text-4xl leading-tight text-[#4A3F35] sm:text-5xl">
            Muito obrigado por aceitar o nosso convite! 💕
          </h1>

          <p className="text-base leading-relaxed text-[#8B7355] sm:text-lg">
            Estamos muito felizes em compartilhar esse momento tão especial com
            você.
          </p>

          <div className="flex w-full flex-col gap-3 text-left">
            <div className="flex items-start gap-3 rounded-xl bg-[#FBF8EF] px-4 py-3">
              <CalendarDays
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-[#C4A35A]"
              />
              <p className="text-base text-[#4A3F35]">
                Nosso <strong>Chá de Panela</strong> acontecerá no dia{" "}
                <strong>05/12/2026, a partir das 18h30</strong>.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#FBF8EF] px-4 py-3">
              <MapPin
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-[#C4A35A]"
              />
              <p className="text-base text-[#4A3F35]">
                <strong>Local:</strong> Rua Roberto Carlos Medeiros, nº 151 –
                Jardim Europa
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#FBF8EF] px-4 py-3">
              <Wine
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-[#C4A35A]"
              />
              <p className="text-base text-[#4A3F35]">
                Para deixar essa celebração ainda mais especial, pedimos apenas
                que você <strong>traga sua bebida preferida</strong> e o{" "}
                <strong>seu cooler</strong> para brindar conosco. 🥂
              </p>
            </div>
          </div>

          <p className="text-base leading-relaxed text-[#8B7355] sm:text-lg">
            Agradecemos de coração pelo carinho e pelo presente. Sua presença
            será, sem dúvida, o nosso maior presente!
          </p>

          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-[#8B7355]">Com muito amor e carinho,</p>
            <p className="font-signature text-4xl text-[#4A3F35] sm:text-5xl">
              Gabriel &amp; Gabrielle ❤️
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
