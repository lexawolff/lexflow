import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type LFStatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
};

export function LFStatCard({ title, value, icon: Icon }: LFStatCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-foreground">{value}</h2>
        </div>

        <div className="rounded-2xl bg-accent p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}