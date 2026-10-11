// Em produção o Next omite a mensagem de qualquer erro lançado por uma Server
// Action (o cliente recebe só o "Minified React error #441"). Por isso as
// actions retornam o erro em vez de lançá-lo: mensagens de validação usam
// ActionError e chegam ao usuário; erros inesperados são logados no servidor e
// viram uma mensagem genérica.

export class ActionError extends Error {}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function toActionResult<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Algo deu errado. Tente novamente." };
  }
}
