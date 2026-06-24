/**
 * Adaptador do Mercado Pago (Checkout Pro).
 * Tudo aqui roda SOMENTE no servidor — usa o MP_ACCESS_TOKEN secreto.
 * Outros gateways (Hotmart/Kiwify/Braip) podem seguir o mesmo formato.
 */
const MP_API = "https://api.mercadopago.com";

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN ausente.");
  return t;
}

export type PreferenceItem = {
  title: string;
  quantity: number;
  unitPriceCents: number;
};

/**
 * Cria uma preferência de pagamento e retorna a URL de checkout.
 * external_reference = id do nosso pedido (usado para creditar no webhook).
 */
export async function createPreference(opts: {
  orderId: string;
  items: PreferenceItem[];
  payerEmail?: string;
  siteUrl: string;
}): Promise<{ id: string; initPoint: string }> {
  // auto_return só com HTTPS público (MP rejeita localhost).
  const isHttps = opts.siteUrl.startsWith("https://");

  const body: Record<string, unknown> = {
    items: opts.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      currency_id: "BRL",
      unit_price: Number((i.unitPriceCents / 100).toFixed(2)),
    })),
    external_reference: opts.orderId,
    payer: opts.payerEmail ? { email: opts.payerEmail } : undefined,
    back_urls: {
      success: `${opts.siteUrl}/checkout/sucesso`,
      pending: `${opts.siteUrl}/checkout/pendente`,
      failure: `${opts.siteUrl}/checkout/falha`,
    },
    notification_url: `${opts.siteUrl}/api/webhooks/mercadopago`,
  };
  if (isHttps) body.auto_return = "approved";

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao criar preferência MP: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    // init_point funciona tanto em produção quanto em teste (token TEST-).
    initPoint: data.init_point ?? data.sandbox_init_point,
  };
}

export type MpPayment = {
  id: string;
  status: string; // approved, pending, in_process, rejected...
  statusDetail?: string | null;
  externalReference: string | null;
  amountCents: number | null;
};

/** Consulta um pagamento pelo id (fonte autoritativa do status). */
export async function getPayment(paymentId: string): Promise<MpPayment | null> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: String(data.id),
    status: data.status,
    statusDetail: data.status_detail ?? null,
    externalReference: data.external_reference ?? null,
    amountCents:
      typeof data.transaction_amount === "number"
        ? Math.round(data.transaction_amount * 100)
        : null,
  };
}

/**
 * Cria um pagamento via Checkout Transparente (Payment Brick).
 * Recebe o `formData` que o Payment Brick monta no front (token, método,
 * parcelas, pagador) e cria o pagamento no servidor com o Access Token.
 * O Access Token NUNCA vai ao front.
 */
export async function createPayment(opts: {
  orderId: string;
  amountCents: number;
  description: string;
  idempotencyKey: string;
  formData: Record<string, unknown>;
}): Promise<MpPayment> {
  const fd = opts.formData;
  const body = {
    transaction_amount: Number((opts.amountCents / 100).toFixed(2)),
    description: opts.description,
    external_reference: opts.orderId,
    token: fd.token,
    payment_method_id: fd.payment_method_id,
    issuer_id: fd.issuer_id,
    installments: fd.installments ?? 1,
    payer: fd.payer,
  };

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      // Idempotência no lado do MP também.
      "X-Idempotency-Key": opts.idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `Falha ao criar pagamento MP: ${res.status} ${JSON.stringify(data)}`
    );
  }

  return {
    id: String(data.id),
    status: data.status,
    statusDetail: data.status_detail ?? null,
    externalReference: data.external_reference ?? null,
    amountCents:
      typeof data.transaction_amount === "number"
        ? Math.round(data.transaction_amount * 100)
        : null,
  };
}
