"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Users, GitBranch, Mail, Search } from "lucide-react";

type SearchResults = {
  clients: Array<{ id: string; name: string; email: string | null; companyName: string | null; status: string }>;
  pipelines: Array<{ id: string; name: string }>;
  templates: Array<{ id: string; name: string }>;
};

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ clients: [], pipelines: [], templates: [] });
  const [loading, setLoading] = useState(false);

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ clients: [], pipelines: [], templates: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router]
  );

  const hasResults =
    results.clients.length > 0 ||
    results.pipelines.length > 0 ||
    results.templates.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search clients, pipelines, templates..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length >= 2 && !loading && !hasResults && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {results.clients.length > 0 && (
            <CommandGroup heading="Clients">
              {results.clients.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`client-${c.id}`}
                  onSelect={() => navigate(`/clients/${c.id}`)}
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span>{c.name}</span>
                    {c.email && (
                      <span className="ml-2 text-xs text-muted-foreground">{c.email}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.pipelines.length > 0 && (
            <CommandGroup heading="Pipelines">
              {results.pipelines.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`pipeline-${p.id}`}
                  onSelect={() => navigate(`/pipelines/${p.id}`)}
                >
                  <GitBranch className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.templates.length > 0 && (
            <CommandGroup heading="Email Templates">
              {results.templates.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`template-${t.id}`}
                  onSelect={() => navigate("/email-templates")}
                >
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{t.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
