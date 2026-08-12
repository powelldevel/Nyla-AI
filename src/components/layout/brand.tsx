type BrandProps = Readonly<{
  compact?: boolean;
}>;

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className="flex items-center gap-3" aria-label="Nyla">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-lg bg-[#1d5c42] text-sm font-bold tracking-[-0.04em] text-white"
      >
        N
      </span>
      <span className={compact ? "text-base font-semibold" : "text-lg font-semibold"}>Nyla</span>
    </div>
  );
}
