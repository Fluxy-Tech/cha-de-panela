// Cookie com o código da família vindo do link de convite (/?tk=CODIGO).
// Fica separado de family-session.ts para poder ser importado pelo proxy.
export const INVITE_CODE_COOKIE = "family_invite_code";
export const INVITE_CODE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias
