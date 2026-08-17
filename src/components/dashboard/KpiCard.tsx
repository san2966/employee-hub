import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "primary" | "success" | "warning" | "destructive" | "muted";

const toneMap: Record<KpiTone, { bar: string; chip: string; icon: string }> = {
  primary: { bar: "bg-primary", chip: "bg-primary/10", icon: "text-primary" },
  success: { bar: "bg-success", chip: "bg-success/10", icon: "text-success" },
  warning: { bar: "bg-warning", chip: "bg-warning/10", icon: "text-warning" },
  destructive: { bar: "bg-destructive", chip: "bg-destructive/10", icon: "text-destructive" },
  muted: { bar: "bg-muted-foreground/40", chip: "bg-muted", icon: "text-muted-foreground" },
};

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: LucideIcon;
  tone?: KpiTone;
  className?: string;
}

export const KpiCard = ({ label, value, sub, icon: Icon, tone = "primary", className }: KpiCardProps) => {
  const t = toneMap[tone];
  return (
    <Card className={cn("card-corporate relative overflow-hidden", className)}>
      <span className={cn("absolute left-0 top-0 h-full w-1", t.bar)} />
      <CardContent className="p-4 pl-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold mt-1 leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <span className={cn("shrink-0 rounded-lg p-2.5", t.chip)}>
            <Icon className={cn("h-5 w-5", t.icon)} />
          </span>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
