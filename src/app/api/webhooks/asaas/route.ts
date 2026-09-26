import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { removePaymentLink } from "@/lib/asaas";

const CONFIRMING_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);

type AsaasWebhookBody = {
  event?: string;
  payment?: {
    id?: string;
    customer?: string;
    invoiceUrl?: string;
    // Id do link de pagamento que originou a cobrança.
    paymentLink?: string | null;
  };
};

// O Asaas envia o token cadastrado no webhook no header "asaas-access-token".
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  const received = request.headers.get("asaas-access-token");
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as AsaasWebhookBody;
  const event = body.event;
  const asaasPayment = body.payment;
  const asaasPaymentId = asaasPayment?.id;

  if (!event || !asaasPaymentId || !CONFIRMING_EVENTS.has(event)) {
    return NextResponse.json({ received: true });
  }

  // A cobrança só passa a existir no Asaas quando o link é pago, então o
  // primeiro webhook chega com um payment.id novo: localizamos a contribuição
  // pelo id do link e gravamos o id da cobrança nela.
  const paymentLinkId = asaasPayment.paymentLink ?? undefined;
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { asaasPaymentId },
        ...(paymentLinkId ? [{ asaasPaymentLinkId: paymentLinkId }] : []),
      ],
    },
  });

  if (!payment) {
    return NextResponse.json({ received: true });
  }

  // O update condicional garante que o valor só é somado ao presente uma vez,
  // mesmo que o Asaas envie PAYMENT_CONFIRMED e PAYMENT_RECEIVED ou repita o
  // mesmo evento ao mesmo tempo.
  const confirmed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "CONFIRMED" } },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        asaasPaymentId,
        asaasCustomerId: asaasPayment.customer ?? payment.asaasCustomerId,
        invoiceUrl: asaasPayment.invoiceUrl ?? payment.invoiceUrl,
      },
    });
    if (count === 0) return false;

    await tx.gift.update({
      where: { id: payment.giftId },
      data: { raisedAmount: { increment: payment.amount } },
    });
    return true;
  });

  if (confirmed && payment.asaasPaymentLinkId) {
    try {
      await removePaymentLink(payment.asaasPaymentLinkId);
    } catch (error) {
      // Não impede a confirmação; o link só continuaria acessível no Asaas.
      console.error("Falha ao remover link de pagamento do Asaas", error);
    }
  }

  return NextResponse.json({ received: true });
}
