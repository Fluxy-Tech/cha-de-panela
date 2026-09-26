import Image from "next/image";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { buildFamilyInviteLink } from "@/lib/app-url";
import { FamiliesSection } from "@/components/dashboard/families-section";
import { GiftsSection } from "@/components/dashboard/gifts-section";

export default async function DashboardPage() {
  const user = await requireUser();

  const [families, gifts] = await Promise.all([
    prisma.family.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          orderBy: [{ isPrincipal: "desc" }, { createdAt: "asc" }],
        },
        payments: {
          where: { status: "CONFIRMED" },
          orderBy: { confirmedAt: "desc" },
          include: { gift: { select: { name: true } } },
        },
      },
    }),
    prisma.gift.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const familyDTOs = families.map((family) => ({
    id: family.id,
    code: family.code,
    inviteLink: buildFamilyInviteLink(family.code),
    members: family.members,
    confirmedPayments: family.payments.map((payment) => ({
      id: payment.id,
      giftName: payment.gift.name,
      amount: payment.amount,
    })),
  }));

  const giftDTOs = gifts.map((gift) => ({
    id: gift.id,
    name: gift.name,
    value: gift.value,
    minValue: gift.minValue,
    raisedAmount: gift.raisedAmount,
    imageUrl: gift.imageUrl,
  }));

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
        <Image
          src="/Girassois.png"
          alt=""
          aria-hidden
          width={1536}
          height={1024}
          loading="eager"
          className="w-48 shrink-0 select-none sm:w-60"
        />
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <h1 className="font-signature text-5xl leading-tight text-[#4A3F35] sm:text-6xl">
            Olá, {user.name || user.email}!
          </h1>
          <p className="mt-1 text-base font-bold text-[#4A3F35] sm:text-lg">
            Bem-vindo(a) ao painel do Chá de Panela.
          </p>
          <p className="mt-2 text-sm text-[#8B7355] sm:text-base">
            Cadastre os presentes, as famílias convidadas e acompanhe as
            contribuições.
          </p>
        </div>
      </div>

      <GiftsSection gifts={giftDTOs} />
      <FamiliesSection families={familyDTOs} />
    </div>
  );
}
