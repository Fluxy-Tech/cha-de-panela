import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Quem já está logado vai direto para o painel. A checagem fica aqui, e não no
// proxy, porque o proxy só enxerga se o cookie existe: com um cookie inválido
// (sessão expirada ou assinada com outro segredo) ele mandava para o
// /dashboard, que mandava de volta para o /login, em loop.
export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return children;
}
