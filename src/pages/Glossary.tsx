import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { glossaryTerms } from "@/data/glossary";
import type { ScreenId } from "@/lib/nav";

export function Glossary({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glossaryTerms;
    return glossaryTerms.filter((t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <ScreenHeader id="GLOSSARY" subtitle="Abbreviations used across the dashboard's screens, for quick reference." onNavigate={onNavigate} />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search term or meaning…"
          className="w-full rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[hsl(var(--pk-accent))]"
        />
      </div>

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-[12.5px] text-[hsl(var(--pk-ink-faint))] px-4 py-6 text-center">No terms match "{query}".</p>
        ) : (
          <div className="divide-y divide-[hsl(var(--pk-border))]">
            {filtered.map((t) => (
              <div key={t.term} className="flex items-start gap-3 px-4 py-2.5">
                <span className="font-mono-pk text-[12px] font-semibold text-[hsl(var(--pk-accent))] w-16 shrink-0">{t.term}</span>
                <span className="text-sm text-[hsl(var(--pk-ink-soft))]">{t.definition}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-[hsl(var(--pk-ink-faint))] mt-3">{filtered.length} of {glossaryTerms.length} terms shown.</p>
    </div>
  );
}
