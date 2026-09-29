"use client";

import { useState, type ReactNode } from "react";
import {
  Baby,
  ChevronRight,
  ClipboardList,
  Coins,
  Home,
  Star,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";

type MemberSummaryDTO = {
  id: string;
  name: string;
  isPrincipal: boolean;
  isChild: boolean;
};

type FamilySummaryDTO = {
  id: string;
  principalName: string;
  members: MemberSummaryDTO[];
};

export type ReportDTO = {
  totalReceived: number;
  confirmedPaymentsCount: number;
  registeredFamilies: FamilySummaryDTO[];
  paidFamilies: FamilySummaryDTO[];
};

type OpenList = "people" | "families" | "registered" | null;

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function adultsAndChildren(members: MemberSummaryDTO[]) {
  const childrenCount = members.filter((member) => member.isChild).length;
  return `${plural(members.length - childrenCount, "adulto", "adultos")} · ${plural(
    childrenCount,
    "criança",
    "crianças",
  )}`;
}

const dialogTitles: Record<Exclude<OpenList, null>, string> = {
  people: "Pessoas que pagaram",
  families: "Famílias que pagaram",
  registered: "Convidados cadastrados",
};

export function ReportSection({ report }: { report: ReportDTO }) {
  const [openList, setOpenList] = useState<OpenList>(null);

  const paidMembers = report.paidFamilies.flatMap((family) => family.members);
  const registeredMembers = report.registeredFamilies.flatMap(
    (family) => family.members,
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold text-[#4A3F35]">
        Relatório
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          detail={adultsAndChildren(paidMembers)}
          onClick={() => setOpenList("people")}
        />
        <StatCard
          icon={<Home className="size-4 text-[#C4A35A]" />}
          label="Famílias que pagaram"
          value={String(report.paidFamilies.length)}
          detail={`de ${plural(
            report.registeredFamilies.length,
            "família convidada",
            "famílias convidadas",
          )}`}
          onClick={() => setOpenList("families")}
        />
        <StatCard
          icon={<ClipboardList className="size-4 text-[#C4A35A]" />}
          label="Convidados cadastrados"
          value={String(registeredMembers.length)}
          detail={`${plural(registeredMembers.length, "pessoa", "pessoas")} em ${plural(
            report.registeredFamilies.length,
            "família",
            "famílias",
          )}`}
          onClick={() => setOpenList("registered")}
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
            {openList && dialogTitles[openList]}
          </DialogTitle>

          {openList === "registered" ? (
            <RegisteredSummary
              families={report.registeredFamilies}
              members={registeredMembers}
            />
          ) : report.paidFamilies.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum pagamento confirmado ainda.
            </p>
          ) : openList === "families" ? (
            <FamilyList families={report.paidFamilies} className="mt-4" />
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

function RegisteredSummary({
  families,
  members,
}: {
  families: FamilySummaryDTO[];
  members: MemberSummaryDTO[];
}) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5 rounded-xl bg-[#FBF8EF] px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs text-[#8B7355]">
            <Home className="size-3.5 text-[#C4A35A]" />
            Famílias
          </span>
          <span className="font-heading text-3xl font-semibold text-[#4A3F35]">
            {families.length}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-[#FBF8EF] px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs text-[#8B7355]">
            <Users className="size-3.5 text-[#C4A35A]" />
            Pessoas
          </span>
          <span className="font-heading text-3xl font-semibold text-[#4A3F35]">
            {members.length}
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {adultsAndChildren(members)}
      </p>

      {families.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma família cadastrada ainda.
        </p>
      ) : (
        <FamilyList families={families} className="max-h-72 overflow-y-auto" />
      )}
    </div>
  );
}

function FamilyList({
  families,
  className = "",
}: {
  families: FamilySummaryDTO[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {families.map((family) => (
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
