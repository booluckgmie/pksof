import { useEffect } from "react";
import {
  LayoutGrid, TrendingUp, Landmark, ShieldCheck, Users, Workflow, GraduationCap, Handshake,
  Wallet, ClipboardList, FileText, Scale, ArrowLeftRight, IdCard, PenLine, CheckSquare,
  Settings as SettingsIcon, BookUser, BookOpen,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { cpNav, fhNav, rpNav, screens, type ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MAIN: LayoutGrid,
  CP001: LayoutGrid, CP002: ClipboardList, CP003: Landmark, CP004: ShieldCheck,
  CP005: Users, CP006: Workflow, CP007: GraduationCap, CP008: Handshake, CP009: BookUser,
  PFH001: Wallet, PFH002: TrendingUp, PFH003: Scale, PFH004: FileText, PFH005: ArrowLeftRight,
  RP001: Users, RP001A: IdCard, RP002: ClipboardList, RP003: TrendingUp, RP004: GraduationCap,
  DATA_ENTRY: PenLine, VERIFY_PUBLISH: CheckSquare, SETTINGS: SettingsIcon,
  GLOSSARY: BookOpen,
};

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (id: ScreenId) => void;
}) {
  const { isRestrictedPillar, canEnterData, canVerify, role } = useSession();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const go = (id: ScreenId) => {
    onNavigate(id);
    onOpenChange(false);
  };

  const item = (id: ScreenId) => {
    const s = screens[id];
    const Icon = ICONS[id];
    return (
      <CommandItem key={id} value={`${s.code} ${s.label}`} onSelect={() => go(id)} className="gap-2.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--pk-ink-faint))]" />
        <span className="font-mono-pk text-[11px] font-semibold text-[hsl(var(--pk-accent))] w-16 shrink-0">{s.code}</span>
        <span className="truncate">{s.label}</span>
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search by screen name or code — e.g. CP001, turnover, governance…" />
      <CommandList>
        <CommandEmpty>No screen matches.</CommandEmpty>
        <CommandGroup heading="Main">{item("MAIN")}</CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Reference">{item("GLOSSARY")}</CommandGroup>
        {!isRestrictedPillar && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Corporate Performance">{cpNav.map(item)}</CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Financial Health">{fhNav.map(item)}</CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Resource & People">{rpNav.map(item)}</CommandGroup>
          </>
        )}
        {(canEnterData || canVerify || role === "admin") && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Data Governance">
              {canEnterData && item("DATA_ENTRY")}
              {canVerify && item("VERIFY_PUBLISH")}
              {role === "admin" && item("SETTINGS")}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
