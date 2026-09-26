import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Gift as GiftIcon } from "lucide-react";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId } from "@/lib/family-session";
import { formatCurrency } from "@/lib/format";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Aguardando pagamento",
  CONFIRMED: "Pago",
  FAILED: "Não concluído",
};

const STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export default async function ContributionsPage() {
  const familyId = await getSessionFamilyId();
  if (!familyId) redirect("/invitations");

  const payments = await prisma.payment.findMany({
    where: { familyId },
    orderBy: { createdAt: "desc" },
    include: { gift: { select: { name: true, imageUrl: true } } },
  });

  const confirmedTotal = payments
    .filter((payment) => payment.status === "CONFIRMED")
    .reduce((total, payment) => total + payment.amount, 0);

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#FDFCF7] px-4 pb-20 pt-40 sm:pt-44">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <Link
          href="/invitations"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#8B7355] transition-colors hover:text-[#4A3F35]"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para a lista de presentes
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="font-signature text-5xl leading-tight text-[#4A3F35] sm:text-6xl">
            Minhas contribuições
          </h1>
          <p className="text-base text-[#8B7355] sm:text-lg">
            Total já confirmado:{" "}
            <strong className="text-[#C4A35A]">
              {formatCurrency(confirmedTotal)}
            </strong>
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 text-center shadow-card">
            <p className="text-base text-[#8B7355]">
              Vocês ainda não fizeram nenhuma contribuição.
            </p>
            <Link
              href="/invitations"
              className="inline-flex h-11 items-center rounded-xl bg-[#4A3F35] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#3A3129]"
            >
              Escolher um presente
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-card sm:flex-row sm:items-center"
              >
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {payment.gift.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={payment.gift.imageUrl}
                      alt={payment.gift.name}
                      className="size-full object-contain"
                    />
                  ) : (
                    <GiftIcon className="size-8 text-[#C4A35A]" />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  <h2 className="font-heading text-lg font-semibold text-[#4A3F35]">
                    {payment.gift.name}
                  </h2>
                  <p className="text-sm text-[#8B7355]">
                    {dateFormatter.format(payment.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                  <span className="text-lg font-semibold text-[#C4A35A]">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[payment.status]}`}
                  >
                    {STATUS_LABEL[payment.status]}
                  </span>
                </div>

                {payment.status === "PENDING" && payment.invoiceUrl && (
                  <a
                    href={payment.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4A3F35] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3A3129]"
                  >
                    Pagar agora
                    <ExternalLink aria-hidden className="size-4" />
                  </a>
                )}
                {payment.status === "CONFIRMED" && payment.invoiceUrl && (
                  <a
                    href={payment.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#4A3F35] px-4 text-sm font-semibold text-[#4A3F35] transition-colors hover:bg-[#4A3F35] hover:text-white"
                  >
                    Ver comprovante
                    <ExternalLink aria-hidden className="size-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
