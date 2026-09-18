import { useEffect, useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Minimal shape of the `beforeinstallprompt` event — not yet in the standard DOM lib types. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari's own (non-standard) flag — no `display-mode` media query support there.
  return (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
}

/**
 * A one-tap "install this app to your home screen" affordance. No browser allows a page to add
 * itself to the home screen silently — this is the closest that's actually possible: a real
 * install prompt where the browser supports `beforeinstallprompt` (Android/desktop Chrome,
 * Edge), or a quick "how to" popover on iOS Safari, which has no install API at all and only
 * offers Add to Home Screen via its own Share sheet. Renders nothing once already installed, or
 * on a browser that offers neither path (e.g. desktop Firefox/Safari).
 */
export function InstallAppButton() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [iosPopoverOpen, setIosPopoverOpen] = useState(false);
  const ios = isIos();

  useEffect(() => {
    if (installed) return;
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  if (installed) return null;
  if (!deferredEvent && !ios) return null; // neither install path is available on this browser

  const runInstall = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    // The prompt event is single-use either way — if dismissed, Chrome may fire a fresh
    // beforeinstallprompt later, which the listener above will pick up again.
    if (outcome === "accepted") setInstalled(true);
    setDeferredEvent(null);
  };

  if (ios && !deferredEvent) {
    return (
      <Popover open={iosPopoverOpen} onOpenChange={setIosPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            title="Add to Home Screen"
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 text-xs">
          <div className="font-semibold text-[hsl(var(--pk-ink))] mb-2">Add to Home Screen</div>
          <ol className="flex flex-col gap-2 text-[hsl(var(--pk-ink-soft))]">
            <li className="flex items-center gap-2"><Share className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--pk-accent))]" />Tap the <span className="font-medium">Share</span> button in Safari's toolbar</li>
            <li className="flex items-center gap-2"><SquarePlus className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--pk-accent))]" />Choose <span className="font-medium">Add to Home Screen</span></li>
          </ol>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      onClick={runInstall}
      title="Install app"
      className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md text-[hsl(var(--pk-ink-soft))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
    >
      <Download className="h-4 w-4" />
    </button>
  );
}
