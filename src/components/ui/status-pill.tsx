type StatusTone = "complete" | "progress";

type StatusPillProps = Readonly<{
  children: string;
  tone: StatusTone;
}>;

const toneStyles: Record<StatusTone, string> = {
  complete: "bg-emerald-50 text-emerald-800 ring-emerald-700/20",
  progress: "bg-amber-50 text-amber-900 ring-amber-700/20",
};

const dotStyles: Record<StatusTone, string> = {
  complete: "bg-emerald-600",
  progress: "bg-amber-600",
};

export function StatusPill({ children, tone }: StatusPillProps) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${toneStyles[tone]}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dotStyles[tone]}`} />
      {children}
    </span>
  );
}
