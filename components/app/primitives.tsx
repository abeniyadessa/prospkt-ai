"use client";

import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUS_LABELS } from "@/lib/types";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

/* ─── Score pill ────────────────────────────────────────────────────────── */

export function ScorePill({ score }: { score: number }) {
  const tier = score >= 8 ? "high" : score >= 5 ? "mid" : "low";
  const styles = {
    high: "text-[#2E7D4F] bg-[#E8F3EC]",
    mid: "text-[#9A6619] bg-[#F7ECD8]",
    low: "text-[#A32A22] bg-[#FAE3E0]",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        styles[tier]
      )}
      title={`Priority score ${score}/10`}
    >
      {score}
    </span>
  );
}

/* ─── Website badge ─────────────────────────────────────────────────────── */

export function WebsiteBadge({ status }: { status: Lead["websiteStatus"] }) {
  const map = {
    none: { dot: "bg-[#C2352C]", label: "No site" },
    outdated: { dot: "bg-[#B47A1F]", label: "Outdated" },
    modern: { dot: "bg-[#2E7D4F]", label: "Modern" },
  } as const;
  const { dot, label } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <span className={cn("size-1.5 rounded-full shrink-0", dot)} aria-hidden />
      {label}
    </span>
  );
}

/* ─── Lead lifecycle badge ───────────────────────────────────────────────── */

export function LifecycleBadge({ status = "new" }: { status?: LeadStatus }) {
  const map: Record<LeadStatus, { dot: string; className: string }> = {
    new: { dot: "bg-[#4B5FAE]", className: "text-[#4B5FAE] bg-[#E8ECFA]" },
    queued: { dot: "bg-[#7752B8]", className: "text-[#7752B8] bg-[#EFE7FA]" },
    called: { dot: "bg-[#6B6B6B]", className: "text-[#5F5F5E] bg-[#F0F0EF]" },
    voicemail: { dot: "bg-[#B47A1F]", className: "text-[#9A6619] bg-[#F7ECD8]" },
    interested: { dot: "bg-[#2E7D4F]", className: "text-[#2E7D4F] bg-[#E8F3EC]" },
    booked: { dot: "bg-[#2E7D4F]", className: "text-[#2E7D4F] bg-[#E8F3EC]" },
    follow_up: { dot: "bg-[#B47A1F]", className: "text-[#9A6619] bg-[#F7ECD8]" },
    not_interested: { dot: "bg-[#9F9F9E]", className: "text-[#6B6B6B] bg-[#F0F0EF]" },
    dnc: { dot: "bg-[#C2352C]", className: "text-[#A32A22] bg-[#FAE3E0]" },
  };
  const item = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        item.className
      )}
    >
      <span className={cn("size-1.5 rounded-full", item.dot)} aria-hidden />
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

/* ─── Status dot ────────────────────────────────────────────────────────── */

export function StatusDot({
  color,
  label,
  className,
}: {
  color: string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground capitalize",
        className
      )}
    >
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}

/* ─── Card ──────────────────────────────────────────────────────────────── */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("card overflow-hidden", className)}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  count,
  action,
  className,
  divided = true,
}: {
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
  divided?: boolean;
}) {
  return (
    <div
      className={cn(
        divided && "card-header",
        "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-balance text-[14px] font-semibold text-foreground">
            {title}
          </h2>
          {typeof count === "number" && (
            <span className="tabular-nums text-[11.5px] font-medium text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-pretty text-[12.5px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/* ─── Page header ───────────────────────────────────────────────────────── */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-balance text-[24px] font-semibold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-prose text-pretty text-[13.5px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 pt-0.5">{actions}</div>
      )}
    </header>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-5 text-center",
        compact ? "py-10" : "py-16"
      )}
    >
      <div
        className="size-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "var(--muted)" }}
      >
        <Icon size={17} color="#9F9F9E" weight="regular" aria-hidden />
      </div>
      <div className="max-w-xs">
        <p className="text-[13.5px] font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-[12.5px] text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ─── Loading state ─────────────────────────────────────────────────────── */

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-5 py-16 text-muted-foreground">
      <span
        className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        aria-hidden
      />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

/* ─── Buttons ───────────────────────────────────────────────────────────── */

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

const btnSize =
  "press inline-flex items-center justify-center gap-1.5 h-8 px-3 text-[12.5px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

export function PrimaryButton({
  loading,
  iconLeft,
  iconRight,
  children,
  className,
  ...rest
}: ButtonBaseProps) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={cn(
        btnSize,
        "bg-foreground text-[color:var(--primary-foreground)] hover:bg-[#1F1F1F]",
        className
      )}
    >
      {loading ? (
        <span
          className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden
        />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}

// AccentButton is kept for API stability — same visual as primary in neutral system.
export function AccentButton(props: ButtonBaseProps) {
  return <PrimaryButton {...props} />;
}

export function GhostButton({
  loading,
  iconLeft,
  iconRight,
  children,
  className,
  ...rest
}: ButtonBaseProps) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={cn(
        btnSize,
        "border border-border bg-surface text-foreground hover:bg-[color:var(--elevated)]",
        className
      )}
    >
      {loading ? (
        <span
          className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden
        />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}

export function IconButton({
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[color:var(--elevated)] hover:text-foreground disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ─── Search input ──────────────────────────────────────────────────────── */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        color="#9F9F9E"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20L16.65 16.65" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] placeholder:text-[color:var(--subtle)] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
      />
    </div>
  );
}

/* ─── Select ────────────────────────────────────────────────────────────── */

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
  disabled,
  label,
  id,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[] | readonly T[];
  className?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
}) {
  const opts = options.map((o) =>
    typeof o === "string" ? { value: o as T, label: o } : o
  );
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next as T);
      }}
      disabled={disabled}
      items={opts}
      modal={false}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={label}
        className={cn(
          "inline-flex h-8 min-w-32 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-left text-[12.5px] font-medium text-foreground shadow-sm shadow-black/[0.02] outline-none transition-colors hover:border-foreground/25 hover:bg-[color:var(--elevated)] disabled:cursor-not-allowed disabled:opacity-50 data-popup-open:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/10",
          className
        )}
      >
        <SelectPrimitive.Value className="min-w-0 flex-1 truncate" />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
          <CaretDownIcon size={12} aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-50"
        >
          <SelectPrimitive.Popup className="min-w-[var(--anchor-width)] max-h-[min(var(--available-height),20rem)] overflow-y-auto rounded-lg border border-hairline bg-surface p-1 text-[12.5px] text-foreground shadow-lg shadow-black/10 outline-none">
            <SelectPrimitive.List>
              {opts.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="grid h-8 cursor-pointer grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2.5 outline-none data-highlighted:bg-[color:var(--elevated)] data-selected:text-foreground"
                >
                  <SelectPrimitive.ItemText className="min-w-0 truncate">
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="text-foreground">
                    <CheckIcon size={12} weight="bold" aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* ─── Text input ────────────────────────────────────────────────────────── */

export function TextInput({
  label,
  hint,
  error,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-[11.5px] font-medium text-muted-foreground">
          {label}
        </p>
      )}
      <input
        {...rest}
        className={cn(
          "w-full h-10 rounded-lg border bg-surface px-3 text-[14px] outline-none transition focus:ring-2 focus:ring-foreground/10",
          error
            ? "border-[color:var(--danger)]"
            : "border-border focus:border-foreground",
          className
        )}
      />
      {hint && !error && (
        <p className="text-[11.5px] text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-[11.5px] text-[color:var(--danger)]">{error}</p>
      )}
    </div>
  );
}

/* ─── Action tile (home grid) ───────────────────────────────────────────── */

export function ActionTile({
  icon: Icon,
  title,
  description,
  onClick,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  tone: {
    bg: string;
    fg: string;
  };
}) {
  return (
    <button
      onClick={onClick}
      className="card lift press text-left p-4 group"
    >
      <div
        className="size-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 ease-out group-hover:scale-[1.04]"
        style={{ backgroundColor: tone.bg }}
      >
        <Icon size={18} color={tone.fg} weight="regular" aria-hidden />
      </div>
      <p className="text-[13.5px] font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">
        {description}
      </p>
    </button>
  );
}
