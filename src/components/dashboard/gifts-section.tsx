"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createGift, updateGift, deleteGift } from "@/app/dashboard/gifts-actions";
import { formatCurrency } from "@/lib/format";

export type GiftDTO = {
  id: string;
  name: string;
  value: number;
  minValue: number;
  raisedAmount: number;
  imageUrl: string | null;
};

function fundedPercentage(gift: GiftDTO) {
  if (gift.value <= 0) return 0;
  return Math.min(100, Math.round((gift.raisedAmount / gift.value) * 100));
}

export function GiftsSection({ gifts }: { gifts: GiftDTO[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newMinValue, setNewMinValue] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editMinValue, setEditMinValue] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

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

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    const name = newName;
    const value = Number(newValue.replace(",", "."));
    const minValue = Number(newMinValue);
    const imageUrl = newImageUrl;
    runAction(
      () => createGift(name, value, minValue, imageUrl),
      () => {
        setNewName("");
        setNewValue("");
        setNewMinValue("");
        setNewImageUrl("");
        setIsCreating(false);
      },
    );
  }

  function startEditing(gift: GiftDTO) {
    setError(null);
    setEditingGiftId(gift.id);
    setEditName(gift.name);
    setEditValue(String(gift.value));
    setEditMinValue(String(gift.minValue));
    setEditImageUrl(gift.imageUrl ?? "");
  }

  function handleSaveEdit(event: FormEvent, giftId: string) {
    event.preventDefault();
    const name = editName;
    const value = Number(editValue.replace(",", "."));
    const minValue = Number(editMinValue);
    const imageUrl = editImageUrl;
    runAction(
      () => updateGift(giftId, name, value, minValue, imageUrl),
      () => setEditingGiftId(null),
    );
  }

  function handleDelete(giftId: string) {
    if (!confirm("Excluir este presente do catálogo?")) return;
    runAction(() => deleteGift(giftId));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">
          Cadastrar Presentes
        </h2>
        {!isCreating && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus data-icon="inline-start" />
            Novo presente
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
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-gift-name">Eletrodoméstico</Label>
                  <Input
                    id="new-gift-name"
                    autoFocus
                    required
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="Ex: Micro-ondas"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-gift-value">Valor (R$)</Label>
                  <Input
                    id="new-gift-value"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newValue}
                    onChange={(event) => setNewValue(event.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-gift-min-value">Valor mínimo (meta)</Label>
                  <Input
                    id="new-gift-min-value"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={newMinValue}
                    onChange={(event) => setNewMinValue(event.target.value)}
                    placeholder="80"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-gift-image">URL da imagem</Label>
                <Input
                  id="new-gift-image"
                  type="url"
                  value={newImageUrl}
                  onChange={(event) => setNewImageUrl(event.target.value)}
                  placeholder="https://..."
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
                    setNewName("");
                    setNewValue("");
                    setNewMinValue("");
                    setNewImageUrl("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {gifts.length === 0 && !isCreating && (
        <p className="text-sm text-muted-foreground">
          Nenhum presente cadastrado ainda.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {gifts.map((gift) => (
          <li
            key={gift.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
          >
            {editingGiftId === gift.id ? (
              <form
                onSubmit={(event) => handleSaveEdit(event, gift.id)}
                className="flex flex-1 flex-col gap-2"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`edit-gift-name-${gift.id}`}>
                      Eletrodoméstico
                    </Label>
                    <Input
                      id={`edit-gift-name-${gift.id}`}
                      autoFocus
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      placeholder="Eletrodoméstico"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`edit-gift-value-${gift.id}`}>
                      Valor (R$)
                    </Label>
                    <Input
                      id={`edit-gift-value-${gift.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      placeholder="Valor (R$)"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`edit-gift-min-value-${gift.id}`}>
                      Valor mínimo (meta)
                    </Label>
                    <Input
                      id={`edit-gift-min-value-${gift.id}`}
                      type="number"
                      min="1"
                      step="1"
                      value={editMinValue}
                      onChange={(event) => setEditMinValue(event.target.value)}
                      placeholder="Valor mínimo"
                    />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor={`edit-gift-image-${gift.id}`}>
                      URL da imagem
                    </Label>
                    <Input
                      id={`edit-gift-image-${gift.id}`}
                      type="url"
                      value={editImageUrl}
                      onChange={(event) => setEditImageUrl(event.target.value)}
                      placeholder="URL da imagem"
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
                    onClick={() => setEditingGiftId(null)}
                  >
                    <X />
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {gift.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="size-16 shrink-0 rounded-md object-cover ring-1 ring-border"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <div className="size-16 shrink-0 rounded-md bg-muted" />
                  )}
                  <div className="flex flex-col text-sm">
                    <span className="font-medium">
                      {gift.name}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {formatCurrency(gift.value)}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(gift.raisedAmount)} arrecadados de{" "}
                      {formatCurrency(gift.value)} · {fundedPercentage(gift)}%
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar presente"
                    onClick={() => startEditing(gift)}
                    disabled={isPending}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Excluir presente"
                    onClick={() => handleDelete(gift.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
