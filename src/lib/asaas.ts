function getApiUrl(): string {
  const url = process.env.ASAAS_API_URL;
  if (!url) throw new Error("ASAAS_API_URL não configurado.");
  return url.replace(/\/+$/, "");
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurado.");
  return key;
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

// Link de pagamento (em vez de cobrança) porque só ele permite limitar o
// número máximo de parcelas por chamada de API (maxInstallmentCount, que exige
// chargeType INSTALLMENT). Com billingType UNDEFINED o pagador escolhe entre
// Pix, cartão de crédito, débito ou boleto na página hospedada pelo Asaas, e
// informa ali os próprios dados (nome, CPF).
export async function createPaymentLink(params: {
  name: string;
  description: string;
  value: number;
  maxInstallmentCount: number;
  externalReference: string;
}): Promise<{ paymentLinkId: string; url: string }> {
  const link = await asaasFetch<AsaasPaymentLink>("/paymentLinks", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      value: params.value,
      billingType: "UNDEFINED",
      chargeType: "INSTALLMENT",
      maxInstallmentCount: params.maxInstallmentCount,
      dueDateLimitDays: 3,
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
