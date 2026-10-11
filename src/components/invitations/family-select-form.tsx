"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { validateFamilyCode } from "@/app/invitations/actions";

type FamilyOption = { id: string; principalName: string };

export function FamilySelectForm({ families }: { families: FamilyOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [familyId, setFamilyId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!familyId) {
      setError("Selecione sua família.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await validateFamilyCode(familyId, code);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push("/invitations/invite");
      } catch {
        setError("Algo deu errado. Tente novamente.");
      }
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Confirmar presença</CardTitle>
        <CardDescription>
          Selecione a sua família e informe o código enviado na mensagem para
          confirmar a presença de todos e ver o seu convite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="family-select">Sua família</Label>
            <select
              id="family-select"
              required
              value={familyId}
              onChange={(event) => setFamilyId(event.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Selecione a família
              </option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  Família de {family.principalName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="family-code">Código de acesso</Label>
            <Input
              id="family-code"
              required
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Ex: RPEH86"
              className="uppercase"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isPending} className="mt-2 w-full">
            {isPending ? "Confirmando..." : "Confirmar presença"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
