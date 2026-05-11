"use client";

import { useEffect, useRef, useState } from "react";
import { OrganizationSwitcher, useClerk } from "@clerk/nextjs";
import {
  HouseIcon,
  UsersIcon,
  PhoneIcon,
  CalendarIcon,
  GearIcon,
  QuestionIcon,
  LightningIcon,
  KanbanIcon,
  CaretUpDownIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { NavKey } from "@/lib/types";
import { useWorkspaceContext } from "@/components/app/workspace-provider";

type NavItem = {
  key: NavKey;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
};

const mainNav: NavItem[] = [
  { key: "Home", icon: HouseIcon, label: "Home", shortcut: "1" },
  { key: "Campaigns", icon: LightningIcon, label: "Campaigns", shortcut: "2" },
  { key: "CRM", icon: UsersIcon, label: "CRM", shortcut: "3" },
  { key: "Pipeline", icon: KanbanIcon, label: "Pipeline", shortcut: "4" },
  { key: "Calls", icon: PhoneIcon, label: "Calls", shortcut: "5" },
  { key: "Bookings", icon: CalendarIcon, label: "Bookings", shortcut: "6" },
];

const bottomNav: NavItem[] = [
  { key: "Settings", icon: GearIcon, label: "Settings", shortcut: "," },
  { key: "Help", icon: QuestionIcon, label: "Help" },
];

export function Sidebar({
  active,
  onChange,
  counts,
}: {
  active: NavKey;
  onChange: (k: NavKey) => void;
  counts: { leads: number; calls: number; appointments: number };
}) {
  const { workspace } = useWorkspaceContext();
  const clerk = useClerk();

  function renderItem(item: NavItem) {
    const isActive = active === item.key;
    const Icon = item.icon;
    const badge =
      item.key === "CRM"
        ? counts.leads
        : item.key === "Calls"
        ? counts.calls
        : item.key === "Bookings"
        ? counts.appointments
        : undefined;

    return (
      <li key={item.key}>
        <button
          type="button"
          onClick={() => onChange(item.key)}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group w-full flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] transition-colors text-left",
            isActive
              ? "bg-white text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)]"
              : "text-[#4D4D4C] hover:bg-[rgba(0,0,0,0.035)] hover:text-foreground"
          )}
        >
          <Icon
            size={15}
            weight="regular"
            className={cn(
              isActive ? "text-foreground" : "text-[#7A7A78]"
            )}
          />
          <span className="font-medium flex-1 truncate">{item.label}</span>
          {typeof badge === "number" && badge > 0 && (
            <span
              className={cn(
                "tabular-nums text-[10.5px] font-medium rounded px-1 py-[1px]",
                isActive
                  ? "bg-[color:var(--muted)] text-muted-foreground"
                  : "text-[#8C8C8A]"
              )}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
          {item.shortcut && !badge && (
            <kbd className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
              {item.shortcut}
            </kbd>
          )}
        </button>
      </li>
    );
  }

  return (
    <aside
      className="hidden w-[232px] shrink-0 flex-col border-r border-hairline md:flex"
      style={{ backgroundColor: "var(--sidebar)" }}
    >
      {/* Workspace selector */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <div
            className="size-6 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#0A0A0A" }}
            aria-hidden
          >
            <LightningIcon size={13} weight="fill" color="#FFFFFF" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-none text-foreground truncate">
              Prospkt
            </p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5 truncate">
              {workspace?.name ?? "Workspace"}
            </p>
          </div>
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/onboarding"
            afterSelectOrganizationUrl="/app"
            afterLeaveOrganizationUrl="/onboarding"
            appearance={{
              elements: {
                organizationSwitcherTrigger:
                  "size-7 rounded-md hover:bg-[rgba(0,0,0,0.035)]",
                organizationPreview: "hidden",
              },
            }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label="Main">
        <ul role="list" className="space-y-0.5">
          {mainNav.map(renderItem)}
        </ul>

        <div className="mt-5 pt-3 border-t border-hairline">
          <ul role="list" className="space-y-0.5">
            {bottomNav.map(renderItem)}
          </ul>
        </div>
      </nav>

      {/* Footer: invite banner + user */}
      <div className="border-t border-hairline">
        <button
          type="button"
          onClick={() => clerk.openOrganizationProfile()}
          className="mx-3 my-3 block rounded-lg p-3 text-left transition-colors hover:bg-[color:var(--elevated)]"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--hairline)" }}
        >
          <p className="text-[12px] font-semibold text-foreground">
            Invite teammates
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
            Bring your team to campaigns, CRM, and booked jobs.
          </p>
        </button>
        <UserMenu />
      </div>
    </aside>
  );
}

function UserMenu() {
  const { user } = useWorkspaceContext();
  const clerk = useClerk();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = (user.name || user.email || "?")
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      ref={wrapperRef}
      className="relative px-3 pb-3"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors",
          open ? "bg-[rgba(0,0,0,0.045)]" : "hover:bg-[rgba(0,0,0,0.035)]"
        )}
      >
        <div className="size-7 shrink-0 rounded-full bg-foreground text-white flex items-center justify-center text-[11px] font-semibold">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-foreground truncate">
            {user.name}
          </p>
          <p className="text-[10.5px] text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
        <CaretUpDownIcon size={14} className="text-[#7A7A78] shrink-0" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-3 right-3 z-50 mb-1 overflow-hidden rounded-lg border border-hairline bg-white shadow-lg shadow-black/[0.06]"
        >
          <div className="px-3 py-2 border-b border-hairline">
            <p className="text-[12px] font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-[10.5px] text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              clerk.openUserProfile();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-foreground hover:bg-[rgba(0,0,0,0.035)]"
          >
            <UserCircleIcon size={15} weight="regular" className="text-[#7A7A78]" />
            Manage account
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void clerk.signOut({ redirectUrl: "/" });
            }}
            className="flex w-full items-center gap-2 border-t border-hairline px-3 py-2 text-left text-[12.5px] text-[color:var(--danger)] hover:bg-[#FAE3E0]"
          >
            <SignOutIcon size={15} weight="regular" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
