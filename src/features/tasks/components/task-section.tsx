import { ReactNode } from "react";

type TaskSectionProps = {
  title: string;
  count: number;
  color: "red" | "yellow" | "blue" | "green";
  children: ReactNode;
};

const colors = {
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  blue: "bg-primary",
  green: "bg-green-500",
};

export function TaskSection({
  title,
  count,
  color,
  children,
}: TaskSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${colors[color]}`} />

        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </div>

      <div className="space-y-3">
        {children}
      </div>
    </section>
  );
}