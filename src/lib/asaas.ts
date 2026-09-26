function getApiUrl(): string {
  const url = process.env.ASAAS_API_URL;
  if (!url) throw new Error("ASAAS_API_URL não configurado.");
  return url.replace(/\/+$/, "");
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurado.");
  // As chaves do Asaas começam com "$", que o Next (.env), o Docker Compose e
  // painéis como o Easypanel tentam expandir como variável (vira vazio). Por
  // isso a chave pode ser configurada SEM o "$" (ex.: aact_hmlg_...) e ele é
  // recolocado aqui. Também aceita "\$aact_..." removendo a barra.
  const normalized = key.trim().replace(/^\\(?=\$)/, "");
  return normalized.startsWith("aact_") ? `$${normalized}` : normalized;
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: getApiKey(),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Asaas ${path} falhou (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

type AsaasPaymentLink = { id: string; url: string };

export type PaymentMode = "single" | "installments";

// Link de pagamento (em vez de cobrança) porque só ele permite limitar o
// número máximo de parcelas por chamada de API (maxInstallmentCount). O
// pagador informa os próprios dados (nome, CPF) na página hospedada pelo Asaas.
//
// Um link INSTALLMENT com billingType UNDEFINED também oferece Pix e boleto
// parcelados, então o parcelamento fica num link só de cartão de crédito:
// - "single": à vista (DETACHED) em Pix, boleto, débito ou crédito.
// - "installments": parcelado (INSTALLMENT) apenas no cartão de crédito.
export async function createPaymentLink(params: {
  name: string;
  description: string;
  value: number;
  mode: PaymentMode;
  maxInstallmentCount: number;
  externalReference: string;
}): Promise<{ paymentLinkId: string; url: string }> {
  const modeFields =
    params.mode === "installments"
      ? {
          billingType: "CREDIT_CARD",
          chargeType: "INSTALLMENT",
          maxInstallmentCount: params.maxInstallmentCount,
        }
      : {
          billingType: "UNDEFINED",
          chargeType: "DETACHED",
          // Dias úteis para pagar o boleto depois de gerado.
          dueDateLimitDays: 3,
        };

  const link = await asaasFetch<AsaasPaymentLink>("/paymentLinks", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      value: params.value,
      ...modeFields,
      externalReference: params.externalReference,
      notificationEnabled: false,
    }),
  });

  return { paymentLinkId: link.id, url: link.url };
}

// Links de pagamento podem ser pagos mais de uma vez; removemos o link assim
// que a contribuição é confirmada para que ele funcione como pagamento único.
export async function removePaymentLink(paymentLinkId: string) {
  await asaasFetch<unknown>(`/paymentLinks/${paymentLinkId}`, {
    method: "DELETE",
  });
}
