import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CircleCheck,
  Gift,
  MapPin,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId } from "@/lib/family-session";

export default async function InvitePage() {
  const familyId = await getSessionFamilyId();
  if (!familyId) redirect("/invitations");

  // A presença é confirmada ao entrar com o código (ou link) da família, que é
  // o que cria a sessão; por isso basta a sessão para ver o convite.
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: { members: { where: { isPrincipal: true }, take: 1 } },
  });
  if (!family) redirect("/invitations");

  const principalName = family.members[0]?.name;

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#FDFCF7] px-4 pb-20 pt-36 sm:pt-40">
      <div className="flex w-full max-w-2xl flex-col gap-6">
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

          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">
            <CircleCheck aria-hidden className="size-4" />
            Presença da família confirmada
          </span>

          <h1 className="font-signature text-4xl leading-tight text-[#4A3F35] sm:text-5xl">
            {principalName
              ? `${principalName}, muito obrigado por aceitar o nosso convite! 💕`
              : "Muito obrigado por aceitar o nosso convite! 💕"}
          </h1>

          <p className="text-base leading-relaxed text-[#8B7355] sm:text-lg">
            Estamos muito felizes em compartilhar esse momento tão especial com
            você e sua família.
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
              <UtensilsCrossed
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-[#C4A35A]"
              />
              <p className="text-base text-[#4A3F35]">
                Vamos ter uma <strong>comida especial</strong>, preparada com
                muito carinho para receber vocês. 🍽️
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#FBF8EF] px-4 py-3">
              <Wine
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-[#C4A35A]"
              />
              <p className="text-base text-[#4A3F35]">
                Vocês só precisam <strong>trazer uma bebida</strong> para
                brindar conosco. 🥂
              </p>
            </div>
          </div>

          <p className="text-base leading-relaxed text-[#8B7355] sm:text-lg">
            Sua presença será, sem dúvida, o nosso maior presente!
          </p>

          <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-[#C4A35A]/40 px-4 py-5">
            <p className="text-base leading-relaxed text-[#4A3F35]">
              Se quiserem nos ajudar a montar o nosso lar, separamos uma lista
              com o que gostaríamos de ter neste início. Cada item tem um{" "}
              <strong>valor simbólico, já pensado para toda a família</strong>.
            </p>
            <Link
              href="/invitations"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#4A3F35] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#3A3129] sm:text-base"
            >
              <Gift aria-hidden className="size-4" />
              Ver a lista do carinho
            </Link>
          </div>

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
