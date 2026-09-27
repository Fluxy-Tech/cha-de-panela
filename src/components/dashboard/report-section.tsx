import { Coins, Home, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export type ReportDTO = {
  totalReceived: number;
  confirmedPaymentsCount: number;
  paidPeopleCount: number;
  paidAdultsCount: number;
  paidChildrenCount: number;
  paidFamiliesCount: number;
  totalFamiliesCount: number;
};

export function ReportSection({ report }: { report: ReportDTO }) {
  const stats = [
    {
      icon: Coins,
      label: "Total recebido",
      value: formatCurrency(report.totalReceived),
      detail: `${report.confirmedPaymentsCount} ${
        report.confirmedPaymentsCount === 1
          ? "contribuição confirmada"
          : "contribuições confirmadas"
      }`,
    },
    {
      icon: Users,
      label: "Pessoas que pagaram",
      value: String(report.paidPeopleCount),
      detail: `${report.paidAdultsCount} ${
        report.paidAdultsCount === 1 ? "adulto" : "adultos"
      } · ${report.paidChildrenCount} ${
        report.paidChildrenCount === 1 ? "criança" : "crianças"
      }`,
    },
    {
      icon: Home,
      label: "Famílias que pagaram",
      value: String(report.paidFamiliesCount),
      detail: `de ${report.totalFamiliesCount} ${
        report.totalFamiliesCount === 1
          ? "família convidada"
          : "famílias convidadas"
      }`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold text-[#4A3F35]">
        Relatório
      </h2>

      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, detail }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-sm text-[#8B7355]">
                <Icon className="size-4 text-[#C4A35A]" />
                {label}
              </span>
              <span className="font-heading text-3xl font-semibold text-[#4A3F35]">
                {value}
              </span>
              <span className="text-xs text-muted-foreground">{detail}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
