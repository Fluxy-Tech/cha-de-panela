"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift as GiftIcon, Flower2, MailOpen, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import type { PaymentMode } from "@/lib/asaas";
import {
  calculateContributionValue,
  maxInstallmentsFor,
} from "@/lib/pricing";
import {
  createProductPayment,
  getPaymentStatus,
} from "@/app/invitations/actions";

type GiftDTO = {
  id: string;
  name: string;
  value: number;
  minValue: number;
  raisedAmount: number;
  imageUrl: string | null;
};

type PaymentResult = {
  paymentId: string;
  amount: number;
  invoiceUrl: string;
  mode: PaymentMode;
};

function fundedPercentage(gift: GiftDTO) {
  if (gift.value <= 0) return 0;
  return Math.min(100, Math.round((gift.raisedAmount / gift.value) * 100));
}

export function ProductsList({
  principalName,
  peopleCount,
  hasContributions,
  hasConfirmedPayment,
  gifts,
}: {
  principalName: string;
  peopleCount: number;
  hasContributions: boolean;
  hasConfirmedPayment: boolean;
  gifts: GiftDTO[];
}) {
  return (
    <div className="relative z-10 flex w-full max-w-[1800px] flex-col gap-12">
      <div className="flex flex-col items-center text-center">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
          <Image
            src="/Girassois.png"
            alt=""
            aria-hidden
            width={1536}
            height={1024}
            priority
            className="w-56 shrink-0 select-none sm:w-72 lg:w-80"
          />
          <div className="flex max-w-xl flex-col items-center text-center sm:items-start sm:text-left">
            <h1 className="font-signature text-5xl leading-tight text-[#4A3F35] sm:text-7xl">
              Olá, {principalName}!
            </h1>
            <p className="mt-1 text-base font-bold leading-relaxed text-[#4A3F35] sm:text-xl">
              Convidamos você e sua família para se juntar a nós e fazer dessa
              celebração ainda mais especial. Contamos com vocês!
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#8B7355] sm:text-lg">
              *Para tornar nosso chá de panela ainda mais especial e nos ajudar
              a montar nosso lar, optamos por contribuição em dinheiro como
              presente.
            </p>
            {(hasConfirmedPayment || hasContributions) && (
              <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
                {hasConfirmedPayment && (
                  <Link
                    href="/invitations/invite"
                    className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-[#4A3F35] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#3A3129] sm:text-base"
                  >
                    <MailOpen aria-hidden className="size-4" />
                    Ver meu convite
                  </Link>
                )}
                {hasContributions && (
                  <Link
                    href="/invitations/contributions"
                    className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-[#4A3F35] px-5 text-sm font-semibold text-[#4A3F35] transition-colors hover:bg-[#4A3F35] hover:text-white sm:text-base"
                  >
                    <Receipt aria-hidden className="size-4" />
                    Quero ver minhas contribuições
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="-mb-4 text-center font-heading text-xl text-[#4A3F35] sm:text-2xl">
        Esta é a nossa lista do carinho para montar o nosso tão sonhado lar.
      </p>

      {gifts.length === 0 ? (
        <p className="text-center text-sm text-[#8B7355]">
          Nenhum produto disponível no momento.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
          {gifts.map((gift) => (
            <ProductCard key={gift.id} gift={gift} peopleCount={peopleCount} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  gift,
  peopleCount,
}: {
  gift: GiftDTO;
  peopleCount: number;
}) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Valor digitado, em centavos (evita erros de arredondamento com float).
  const [amountCents, setAmountCents] = useState(0);
  const [mode, setMode] = useState<PaymentMode>("single");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [status, setStatus] = useState<"PENDING" | "CONFIRMED" | "FAILED" | null>(
    null,
  );

  const suggestedValue = calculateContributionValue(gift.minValue, peopleCount);
  const percentage = fundedPercentage(gift);

  useEffect(() => {
    if (!payment || status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const current = await getPaymentStatus(payment.paymentId);
        setStatus(current);
        // Atualiza a página para mostrar o valor arrecadado e o botão
        // "Ver meu convite" assim que o pagamento é confirmado.
        if (current === "CONFIRMED") router.refresh();
      } catch {
        // ignora falhas pontuais de rede e tenta de novo no próximo tick
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [payment, status, router]);

  function handleOpenDialog() {
    if (!payment) {
      setAmountCents(Math.round(suggestedValue * 100));
    }
    setIsDialogOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = amountCents / 100;
    if (parsedAmount < suggestedValue) {
      setError(
        `O valor não pode ser menor que o sugerido (${formatCurrency(suggestedValue)}).`,
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await createProductPayment(gift.id, parsedAmount, mode);
        setPayment({ ...result, mode });
        setStatus("PENDING");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  const fundingProgress = (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-[#4A3F35]">
          {formatCurrency(gift.raisedAmount)} arrecadados
        </span>
        <span className="text-[#C4A35A]">
          Meta: {formatCurrency(gift.value)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[#F5F0E1]"
      >
        <div
          className="h-full rounded-full bg-[#C4A35A] transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  return (
    <>
      <article className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-card">
        <div className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded-xl bg-white">
          {gift.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gift.imageUrl}
              alt={gift.name}
              className="h-full w-auto max-w-full object-contain"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
            />
          ) : (
            <GiftIcon className="size-12 text-[#C4A35A]" />
          )}
        </div>

        <h2 className="font-heading text-xl font-semibold text-[#4A3F35]">
          {gift.name}
        </h2>

        {fundingProgress}

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-xl bg-[#FBF8EF] px-3 py-3">
          <span className="text-sm font-bold text-[#4A3F35]">Sugestão para presente</span>
          <span className="text-lg font-semibold text-[#C4A35A]">
            {formatCurrency(suggestedValue)}
          </span>
        </div>

        {status === "CONFIRMED" ? (
          <p className="flex h-11 items-center justify-center rounded-xl bg-[#FBF8EF] text-base font-semibold text-[#A8883F]">
            Pago! Obrigado 💛
          </p>
        ) : (
          <button
            type="button"
            onClick={handleOpenDialog}
            className="h-11 rounded-xl bg-[#4A3F35] text-base font-semibold text-white transition-colors hover:bg-[#3A3129]"
          >
            {payment ? "Continuar pagamento" : "Contribuir agora"}
          </button>
        )}
      </article>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="aspect-square overflow-hidden rounded-xl bg-white sm:aspect-auto sm:h-full">
              {gift.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gift.imageUrl}
                  alt={gift.name}
                  className="size-full object-contain"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <GiftIcon className="size-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 py-2 sm:pr-8">
              <DialogTitle className="text-2xl text-[#4A3F35] sm:text-3xl">{gift.name}</DialogTitle>
              {fundingProgress}

              {status === "CONFIRMED" ? (
                <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  Pago! Obrigado 💛
                </p>
              ) : payment ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-border px-3 py-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Continue o pagamento de {formatCurrency(payment.amount)}{" "}
                    no Asaas.{" "}
                    {payment.mode === "installments"
                      ? `Parcele no cartão de crédito em até ${maxInstallmentsFor(payment.amount)}x.`
                      : "Pague à vista com Pix, boleto, débito ou cartão de crédito."}
                  </p>
                  <Button
                    size="sm"
                    render={
                      <a
                        href={payment.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    Ir para o pagamento
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Assim que o pagamento for confirmado, o valor é
                    atualizado aqui automaticamente.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`amount-${gift.id}`}>
                      Valor da contribuição
                    </Label>
                    <Input
                      id={`amount-${gift.id}`}
                      aria-describedby={`amount-description-${gift.id}`}
                      required
                      inputMode="numeric"
                      value={formatCurrency(amountCents / 100)}
                      onChange={(event) => {
                        // Máscara de moeda: os dígitos entram pela direita
                        // (ex.: 1 → R$ 0,01, 12 → R$ 0,12, 1234 → R$ 12,34).
                        const digits = event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 9);
                        setAmountCents(Number(digits || "0"));
                      }}
                    />
                    <p
                      id={`amount-description-${gift.id}`}
                      className="text-sm text-muted-foreground"
                    >
                      Valor sugerido e mínimo: {formatCurrency(suggestedValue)}
                    </p>
                  </div>
                  <fieldset className="flex flex-col gap-1.5">
                    <legend className="mb-1.5 text-sm font-medium">
                      Forma de pagamento
                    </legend>
                    {(
                      [
                        {
                          value: "single",
                          title: "À vista",
                          description: "Pix, boleto, débito ou cartão de crédito",
                        },
                        {
                          value: "installments",
                          title: `Parcelado em até ${maxInstallmentsFor(amountCents / 100)}x`,
                          description: "Somente no cartão de crédito",
                        },
                      ] as const
                    ).map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                          mode === option.value
                            ? "border-[#C4A35A] bg-[#FBF8EF]"
                            : "border-border hover:bg-[#FBF8EF]"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`payment-mode-${gift.id}`}
                          value={option.value}
                          checked={mode === option.value}
                          onChange={() => setMode(option.value)}
                          className="size-4 accent-[#4A3F35]"
                        />
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold text-[#4A3F35]">
                            {option.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  {error && (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <div className="mt-1 flex flex-col gap-2">
                    <Button type="submit" size="sm" className="w-full" disabled={isPending}>
                      <Flower2 data-icon="inline-start" />
                      {isPending ? "Gerando link..." : "Gerar link de pagamento"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
