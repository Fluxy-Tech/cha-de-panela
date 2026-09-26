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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Olá, {user.name || user.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo(a) ao painel do Chá de Panela.
        </p>
      </div>

      <GiftsSection gifts={giftDTOs} />
      <FamiliesSection families={familyDTOs} />
    </div>
  );
}
