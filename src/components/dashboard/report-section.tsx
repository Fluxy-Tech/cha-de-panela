"use client";

import { useState, type ReactNode } from "react";
import { Baby, ChevronRight, Coins, Home, Star, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";

type PaidMemberDTO = {
  id: string;
  name: string;
  isPrincipal: boolean;
  isChild: boolean;
};

type PaidFamilyDTO = {
  id: string;
  principalName: string;
  members: PaidMemberDTO[];
};

export type ReportDTO = {
  totalReceived: number;
  confirmedPaymentsCount: number;
  totalFamiliesCount: number;
  paidFamilies: PaidFamilyDTO[];
};

type OpenList = "people" | "families" | null;

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function ReportSection({ report }: { report: ReportDTO }) {
  const [openList, setOpenList] = useState<OpenList>(null);

  const paidMembers = report.paidFamilies.flatMap((family) => family.members);
  const paidChildrenCount = paidMembers.filter((member) => member.isChild).length;
  const paidAdultsCount = paidMembers.length - paidChildrenCount;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold text-[#4A3F35]">
        Relatório
      </h2>

      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          icon={<Coins className="size-4 text-[#C4A35A]" />}
          label="Total recebido"
          value={formatCurrency(report.totalReceived)}
          detail={plural(
            report.confirmedPaymentsCount,
            "contribuição confirmada",
            "contribuições confirmadas",
          )}
        />
        <StatCard
          icon={<Users className="size-4 text-[#C4A35A]" />}
          label="Pessoas que pagaram"
          value={String(paidMembers.length)}
          detail={`${plural(paidAdultsCount, "adulto", "adultos")} · ${plural(
            paidChildrenCount,
            "criança",
            "crianças",
          )}`}
          onClick={() => setOpenList("people")}
        />
        <StatCard
          icon={<Home className="size-4 text-[#C4A35A]" />}
          label="Famílias que pagaram"
          value={String(report.paidFamilies.length)}
          detail={`de ${plural(
            report.totalFamiliesCount,
            "família convidada",
            "famílias convidadas",
          )}`}
          onClick={() => setOpenList("families")}
        />
      </div>

      <Dialog
        open={openList !== null}
        onOpenChange={(open) => {
          if (!open) setOpenList(null);
        }}
      >
        <DialogContent className="max-w-md p-6">
          <DialogTitle className="pr-10 text-2xl text-[#4A3F35]">
            {openList === "families"
              ? "Famílias que pagaram"
              : "Pessoas que pagaram"}
          </DialogTitle>

          {report.paidFamilies.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum pagamento confirmado ainda.
            </p>
          ) : openList === "families" ? (
            <ul className="mt-4 flex flex-col gap-2">
              {report.paidFamilies.map((family) => (
                <li
                  key={family.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[#FBF8EF] px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 text-[#4A3F35]">
                    <Star className="size-3.5 fill-[#C4A35A] text-[#C4A35A]" />
                    {family.principalName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {plural(family.members.length, "pessoa", "pessoas")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {report.paidFamilies.map((family) => (
                <div key={family.id} className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#8B7355]">
                    Família de {family.principalName}
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {family.members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-2 rounded-xl bg-[#FBF8EF] px-3 py-2 text-sm text-[#4A3F35]"
                      >
                        {member.isPrincipal && (
                          <Star className="size-3.5 fill-[#C4A35A] text-[#C4A35A]" />
                        )}
                        {member.name}
                        {member.isChild && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <Baby className="size-3" />
                            Criança
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  onClick?: () => void;
}) {
  // Só <span> dentro do cartão: ele vira <button> quando é clicável.
  const content = (
    <>
      <span className="flex items-center gap-2 text-sm text-[#8B7355]">
        {icon}
        {label}
        {onClick && <ChevronRight className="ml-auto size-4" />}
      </span>
      <span className="font-heading text-3xl font-semibold text-[#4A3F35]">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </>
  );

  const cardClassName =
    "flex flex-col gap-1 rounded-2xl bg-card p-5 text-left text-card-foreground shadow-card";

  if (!onClick) return <div className={cardClassName}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cardClassName} cursor-pointer transition-shadow outline-none hover:ring-2 hover:ring-[#C4A35A]/40 focus-visible:ring-2 focus-visible:ring-[#C4A35A]`}
    >
      {content}
    </button>
  );
}
