import { CreditCard, Package, ShieldCheck, Store, Watch, Wrench } from "lucide-react";

const marks = [
  { icon: Watch, label: "Retail sales" },
  { icon: Wrench, label: "Repairs" },
  { icon: Package, label: "Inventory" },
  { icon: CreditCard, label: "Payments" },
];

export function LoginBrand() {
  return (
    <section
      className="relative overflow-hidden bg-[#14151c] text-white login-rise lg:min-h-screen"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 15%, rgb(79 70 229 / 0.45), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 90%, rgb(99 91 255 / 0.18), transparent 50%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 top-16 hidden size-[420px] rounded-full border border-white/10 lg:block" aria-hidden />
      <div className="pointer-events-none absolute -right-4 top-28 hidden size-[300px] rounded-full border border-white/10 lg:block" aria-hidden />
      <div className="pointer-events-none absolute right-16 top-48 hidden size-[160px] rounded-full border border-white/15 lg:block" aria-hidden />

      <div className="relative flex flex-col justify-between gap-8 px-6 py-8 sm:px-10 lg:h-full lg:px-14 lg:py-12">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#14151c]">
            <Watch className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Watch POS</p>
            <p className="text-xs text-white/60">Retail & Repair Management</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-[1.15]">
            Precision at every sale.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70 sm:text-base">
            Sales, repairs, inventory, and daily operations in one focused workspace.
          </p>
          <ul className="mt-8 hidden gap-3 sm:grid sm:grid-cols-2">
            {marks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-white/75">
                <Icon className="size-4 text-white/50" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden />
            Secure access
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Store className="size-3.5" aria-hidden />
            Local shop workflow
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Watch className="size-3.5" aria-hidden />
            Fast checkout
          </li>
        </ul>
      </div>
    </section>
  );
}
