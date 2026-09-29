"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { INVITE_CODE_COOKIE } from "@/lib/invite-code";
import {
  setFamilySessionCookie,
  getSessionFamilyId,
} from "@/lib/family-session";
import {
  calculateContributionValue,
  isFullyFunded,
  maxInstallmentsFor,
} from "@/lib/pricing";
import { createPaymentLink, type PaymentMode } from "@/lib/asaas";
import { formatCurrency } from "@/lib/format";

export async function validateFamilyCode(familyId: string, code: string) {
  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) {
    throw new Error("Informe o código recebido na mensagem.");
  }

  const family = await prisma.family.findUnique({ where: { id: familyId } });
  if (!family || family.code !== trimmedCode) {
    throw new Error("Código inválido. Confira a mensagem que você recebeu.");
  }

  await setFamilySessionCookie(family.id);
  revalidatePath("/invitations");
}

// Usado pelo link de convite (/?tk=CODIGO, guardado em cookie pelo proxy, ou
// /invitations?tk=CODIGO): o código já identifica a família sozinho, sem
// precisar selecioná-la em uma lista. Retorna o erro em vez de lançar para que
// o cookie do convite seja removido mesmo quando o código é inválido.
export async function validateFamilyByLinkCode(
  code: string,
): Promise<{ error: string | null }> {
  (await cookies()).delete(INVITE_CODE_COOKIE);

  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) {
    return { error: "Link inválido." };
  }

  const family = await prisma.family.findUnique({
    where: { code: trimmedCode },
  });
  if (!family) {
    return { error: "Link inválido ou expirado." };
  }

  await setFamilySessionCookie(family.id);
  revalidatePath("/invitations");
  return { error: null };
}

export async function createProductPayment(
  giftId: string,
  amount: number,
  mode: PaymentMode,
) {
  if (mode !== "single" && mode !== "installments") {
    throw new Error("Forma de pagamento inválida.");
  }

  const familyId = await getSessionFamilyId();
  if (!familyId) {
    throw new Error("Sessão expirada. Selecione sua família novamente.");
  }

  const [family, gift] = await Promise.all([
    prisma.family.findUniqueOrThrow({
      where: { id: familyId },
      include: {
        members: { orderBy: [{ isPrincipal: "desc" }, { createdAt: "asc" }] },
      },
    }),
    prisma.gift.findUniqueOrThrow({ where: { id: giftId } }),
  ]);

  if (isFullyFunded(gift)) {
    throw new Error("Este presente já foi totalmente arrecadado. Obrigado!");
  }

  const principal = family.members.find((member) => member.isPrincipal);
  if (!principal) {
    throw new Error("Família sem integrante principal cadastrado.");
  }

  const peopleCount = family.members.filter((member) => !member.isChild).length;
  const suggestedValue = calculateContributionValue(gift.minValue, peopleCount);

  if (!Number.isFinite(amount) || amount < suggestedValue) {
    throw new Error(
      `O valor não pode ser menor que o sugerido (${formatCurrency(suggestedValue)}).`,
    );
  }

  const link = await createPaymentLink({
    name: `Chá de Panela · ${gift.name}`,
    value: amount,
    mode,
    maxInstallmentCount: maxInstallmentsFor(amount),
    externalReference: `${family.id}:${gift.id}:${Date.now()}`,
    description: buildPaymentDescription(
      gift.name,
      family.members.map((member) => member.name),
    ),
  });

  const payment = await prisma.payment.create({
    data: {
      familyId: family.id,
      giftId: gift.id,
      payerName: principal.name,
      amount,
      asaasPaymentLinkId: link.paymentLinkId,
      invoiceUrl: link.url,
    },
  });

  revalidatePath("/invitations");

  return {
    paymentId: payment.id,
    amount,
    invoiceUrl: link.url,
  };
}

export async function getPaymentStatus(paymentId: string) {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    select: { status: true },
  });
  return payment.status;
}

// O Asaas aceita no máximo 500 caracteres na descrição da cobrança.
const ASAAS_DESCRIPTION_MAX_LENGTH = 500;

function buildPaymentDescription(giftName: string, memberNames: string[]) {
  const description = `Chá de Panela · ${giftName} · Família: ${memberNames.join(", ")}`;
  if (description.length <= ASAAS_DESCRIPTION_MAX_LENGTH) return description;
  return `${description.slice(0, ASAAS_DESCRIPTION_MAX_LENGTH - 1)}…`;
}
