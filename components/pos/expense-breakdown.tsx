import { formatLkr } from "@/lib/money/format";

const SLICE_COLORS = ["#2a2633", "#b08968", "#5c6bc0", "#0f766e", "#c2410c", "#7c3aed", "#0369a1", "#a16207"];

export function expenseColor(index: number) {
  return SLICE_COLORS[index % SLICE_COLORS.length];
}

export function ExpenseBreakdown({
  categories,
  totalCents,
}: {
  categories: { name: string; amountCents: number }[];
  totalCents: number;
}) {
  let offset = 0;
  const slices = categories.map((category, index) => {
    const share = totalCents > 0 ? (category.amountCents / totalCents) * 100 : 0;
    const slice = { ...category, share, offset, color: expenseColor(index) };
    offset += share;
    return slice;
  });

  if (totalCents <= 0) return null;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[9rem_1fr]">
      <svg viewBox="0 0 36 36" className="mx-auto size-36 -rotate-90" role="img" aria-label="Expense share by category">
        <circle cx="18" cy="18" r="15.915" fill="none" className="stroke-[#e7e1d8]" strokeWidth="3.6" />
        {slices.map((slice) => (
          <circle
            key={slice.name}
            cx="18"
            cy="18"
            r="15.915"
            fill="none"
            stroke={slice.color}
            strokeWidth="3.6"
            strokeDasharray={`${slice.share} ${100 - slice.share}`}
            strokeDashoffset={-slice.offset}
          />
        ))}
      </svg>
      <ul className="space-y-3">
        {slices.map((slice) => (
          <li key={slice.name}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="truncate font-medium">{slice.name}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatLkr(slice.amountCents)} · {Math.round(slice.share)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#efeae3]">
              <div className="h-full rounded-full" style={{ width: `${slice.share}%`, backgroundColor: slice.color }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
