import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { INVITE_CODE_COOKIE } from "@/lib/invite-code";
import { getSessionFamilyId } from "@/lib/family-session";
import { FamilySelectForm } from "@/components/invitations/family-select-form";
import { AutoFamilyAccess } from "@/components/invitations/auto-family-access";
import { ProductsList } from "@/components/invitations/products-list";

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tk?: string | string[] }>;
}) {
  // Código do convite: vem do cookie gravado pelo proxy (link /?tk=CODIGO) ou,
  // por compatibilidade, direto na URL (/invitations?tk=CODIGO). Tem prioridade
  // sobre a sessão atual para que um novo link troque a família autenticada.
  const { tk } = await searchParams;
  const linkCode =
    (Array.isArray(tk) ? tk[0] : tk) ??
    (await cookies()).get(INVITE_CODE_COOKIE)?.value;

  const familyId = linkCode ? null : await getSessionFamilyId();

  if (familyId) {
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: { members: { orderBy: [{ isPrincipal: "desc" }, { createdAt: "asc" }] } },
    });

    if (family) {
      const [gifts, paymentsCount] = await Promise.all([
        prisma.gift.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.payment.count({ where: { familyId: family.id } }),
      ]);

      const principal = family.members.find((member) => member.isPrincipal);
      const peopleCount = family.members.filter((member) => !member.isChild).length;

      return (
        <main className="flex min-h-screen flex-col items-center bg-[#FDFCF7] px-4 pb-20 pt-40 sm:pt-44">
          <ProductsList
            principalName={principal?.name ?? "convidado"}
            peopleCount={peopleCount}
            hasContributions={paymentsCount > 0}
            gifts={gifts.map((gift) => ({
              id: gift.id,
              name: gift.name,
              value: gift.value,
              minValue: gift.minValue,
              raisedAmount: gift.raisedAmount,
              imageUrl: gift.imageUrl,
            }))}
          />
        </main>
      );
    }
  }

  const families = await prisma.family.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: { where: { isPrincipal: true }, take: 1 },
    },
  });

  const familyOptions = families
    .filter((family) => family.members[0])
    .map((family) => ({
      id: family.id,
      principalName: family.members[0].name,
    }));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFFCEA] px-4 pt-24 pb-12">
      {linkCode ? (
        <AutoFamilyAccess code={linkCode} families={familyOptions} />
      ) : (
        <FamilySelectForm families={familyOptions} />
      )}
    </main>
  );
}
