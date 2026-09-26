"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FamilySelectForm } from "@/components/invitations/family-select-form";
import { validateFamilyByLinkCode } from "@/app/invitations/actions";

type FamilyOption = { id: string; principalName: string };

export function AutoFamilyAccess({
  code,
  families,
}: {
  code: string;
  families: FamilyOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await validateFamilyByLinkCode(code);
        if (result.error) {
          setError(result.error);
          setAttempted(true);
          return;
        }
        router.replace("/invitations");
        router.refresh();
      } catch {
        setError("Link inválido.");
        setAttempted(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!attempted || isPending) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300">
        Validando seu acesso...
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
      <FamilySelectForm families={families} />
    </div>
  );
}
