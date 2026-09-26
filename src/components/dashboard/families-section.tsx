"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  Check,
  Copy,
  Baby,
  Coins,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createFamily,
  addMember,
  renameMember,
  toggleMemberIsChild,
  setPrincipal,
  deleteMember,
  deleteFamily,
} from "@/app/dashboard/families-actions";
import { formatCurrency } from "@/lib/format";

type MemberDTO = {
  id: string;
  name: string;
  isPrincipal: boolean;
  isChild: boolean;
};

type ConfirmedPaymentDTO = {
  id: string;
  giftName: string;
  amount: number;
};

export type FamilyDTO = {
  id: string;
  code: string;
  inviteLink: string;
  members: MemberDTO[];
  confirmedPayments: ConfirmedPaymentDTO[];
};

export function FamiliesSection({ families }: { families: FamilyDTO[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newPrincipalName, setNewPrincipalName] = useState("");

  const [addingToFamilyId, setAddingToFamilyId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberIsChild, setNewMemberIsChild] = useState(false);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const [copied, setCopied] = useState<{
    familyId: string;
    field: "code" | "link";
  } | null>(null);

  function runAction(action: () => Promise<void>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        onDone?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  function handleCreateFamily(event: FormEvent) {
    event.preventDefault();
    const name = newPrincipalName;
    runAction(
      () => createFamily(name),
      () => {
        setNewPrincipalName("");
        setIsCreating(false);
      },
    );
  }

  function handleAddMember(event: FormEvent, familyId: string) {
    event.preventDefault();
    const name = newMemberName;
    const isChild = newMemberIsChild;
    runAction(
      () => addMember(familyId, name, isChild),
      () => {
        setNewMemberName("");
        setNewMemberIsChild(false);
        setAddingToFamilyId(null);
      },
    );
  }

  function startEditing(member: MemberDTO) {
    setError(null);
    setEditingMemberId(member.id);
    setEditingValue(member.name);
  }

  function handleRename(event: FormEvent, memberId: string) {
    event.preventDefault();
    const name = editingValue;
    runAction(
      () => renameMember(memberId, name),
      () => setEditingMemberId(null),
    );
  }

  function handleToggleChild(member: MemberDTO) {
    runAction(() => toggleMemberIsChild(member.id, !member.isChild));
  }

  function handleSetPrincipal(familyId: string, memberId: string) {
    runAction(() => setPrincipal(familyId, memberId));
  }

  function handleDeleteMember(memberId: string) {
    if (!confirm("Excluir este integrante?")) return;
    runAction(() => deleteMember(memberId));
  }

  function handleDeleteFamily(familyId: string) {
    if (!confirm("Excluir esta família e todos os seus integrantes?")) return;
    runAction(() => deleteFamily(familyId));
  }

  async function handleCopy(
    familyId: string,
    field: "code" | "link",
    value: string,
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied({ familyId, field });
      setTimeout(
        () =>
          setCopied((current) =>
            current?.familyId === familyId && current.field === field
              ? null
              : current,
          ),
        1500,
      );
    } catch {
      // clipboard indisponível — ignora
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">
          Cadastrar Famílias
        </h2>
        {!isCreating && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus data-icon="inline-start" />
            Nova família
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {isCreating && (
        <Card>
          <CardContent className="pt-4">
            <form
              onSubmit={handleCreateFamily}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="principal-name">Nome do principal</Label>
                <Input
                  id="principal-name"
                  autoFocus
                  required
                  value={newPrincipalName}
                  onChange={(event) => setNewPrincipalName(event.target.value)}
                  placeholder="Ex: Maria Silva"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewPrincipalName("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {families.length === 0 && !isCreating && (
        <p className="text-sm text-muted-foreground">
          Nenhuma família cadastrada ainda.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {families.map((family) => {
          const principal = family.members.find((m) => m.isPrincipal);

          return (
            <Card key={family.id}>
              <CardHeader className="flex-row items-start justify-between">
                <CardTitle>
                  {principal ? `Família de ${principal.name}` : "Família"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Excluir família"
                  onClick={() => handleDeleteFamily(family.id)}
                  disabled={isPending}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2">
                  <span className="text-sm">
                    Código de acesso:{" "}
                    <span className="font-mono font-semibold tracking-wider">
                      {family.code}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copiar código"
                    onClick={() => handleCopy(family.id, "code", family.code)}
                  >
                    {copied?.familyId === family.id && copied.field === "code" ? (
                      <Check />
                    ) : (
                      <Copy />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm">
                    <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">Link de convite</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copiar link de convite"
                    onClick={() =>
                      handleCopy(family.id, "link", family.inviteLink)
                    }
                  >
                    {copied?.familyId === family.id && copied.field === "link" ? (
                      <Check />
                    ) : (
                      <Copy />
                    )}
                  </Button>
                </div>

                {family.confirmedPayments.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {family.confirmedPayments.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Coins className="size-4 text-muted-foreground" />
                          {payment.giftName}
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(payment.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <ul className="flex flex-col gap-2">
                  {family.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      {editingMemberId === member.id ? (
                        <form
                          onSubmit={(event) => handleRename(event, member.id)}
                          className="flex flex-1 items-end gap-2"
                        >
                          <div className="flex flex-1 flex-col gap-1.5">
                            <Label htmlFor={`edit-member-${member.id}`}>
                              Nome
                            </Label>
                            <Input
                              id={`edit-member-${member.id}`}
                              autoFocus
                              value={editingValue}
                              onChange={(event) =>
                                setEditingValue(event.target.value)
                              }
                            />
                          </div>
                          <Button
                            type="submit"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Salvar"
                            disabled={isPending}
                          >
                            <Check />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Cancelar"
                            onClick={() => setEditingMemberId(null)}
                          >
                            <X />
                          </Button>
                        </form>
                      ) : (
                        <>
                          <span className="flex items-center gap-2 text-sm">
                            {member.isPrincipal && (
                              <Star className="size-3.5 fill-primary text-primary" />
                            )}
                            {member.name}
                            {member.isChild && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                <Baby className="size-3" />
                                Criança
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            {!member.isPrincipal && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={
                                  member.isChild
                                    ? "Desmarcar como criança"
                                    : "Marcar como criança"
                                }
                                title={
                                  member.isChild
                                    ? "Desmarcar como criança"
                                    : "Marcar como criança"
                                }
                                onClick={() => handleToggleChild(member)}
                                disabled={isPending}
                              >
                                <Baby
                                  className={
                                    member.isChild ? "text-primary" : undefined
                                  }
                                />
                              </Button>
                            )}
                            {!member.isPrincipal && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Tornar principal"
                                title="Tornar principal"
                                onClick={() =>
                                  handleSetPrincipal(family.id, member.id)
                                }
                                disabled={isPending}
                              >
                                <Star />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Editar nome"
                              onClick={() => startEditing(member)}
                              disabled={isPending}
                            >
                              <Pencil />
                            </Button>
                            {!member.isPrincipal && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Excluir integrante"
                                onClick={() => handleDeleteMember(member.id)}
                                disabled={isPending}
                              >
                                <Trash2 className="text-destructive" />
                              </Button>
                            )}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                {addingToFamilyId === family.id ? (
                  <form
                    onSubmit={(event) => handleAddMember(event, family.id)}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-end gap-2">
                      <div className="flex flex-1 flex-col gap-1.5">
                        <Label htmlFor={`new-member-${family.id}`}>
                          Nome da pessoa
                        </Label>
                        <Input
                          id={`new-member-${family.id}`}
                          autoFocus
                          required
                          placeholder="Nome da pessoa"
                          value={newMemberName}
                          onChange={(event) => setNewMemberName(event.target.value)}
                        />
                      </div>
                      <Button type="submit" size="sm" disabled={isPending}>
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddingToFamilyId(null);
                          setNewMemberName("");
                          setNewMemberIsChild(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={newMemberIsChild}
                        onChange={(event) =>
                          setNewMemberIsChild(event.target.checked)
                        }
                        className="size-4 rounded border-input"
                      />
                      É criança (não cobrar contribuição)
                    </label>
                  </form>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => setAddingToFamilyId(family.id)}
                  >
                    <Plus data-icon="inline-start" />
                    Adicionar pessoa
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
