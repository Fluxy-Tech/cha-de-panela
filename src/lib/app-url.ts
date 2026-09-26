function getAppUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL não configurado.");
  return url.replace(/\/+$/, "");
}

export function buildFamilyInviteLink(familyCode: string): string {
  return `${getAppUrl()}/?tk=${familyCode}`;
}
