"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X, Tag } from "lucide-react";

type TagData = { id: string; name: string; color: string };

export function ClientTags({ clientId }: { clientId: string }) {
  const [clientTags, setClientTags] = useState<TagData[]>([]);
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${clientId}`).then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ]).then(([clientData, tagsData]) => {
      if (clientData.tags) {
        setClientTags(clientData.tags.map((t: { tag: TagData }) => t.tag));
      }
      setAllTags(Array.isArray(tagsData) ? tagsData : []);
    }).catch(() => {});
  }, [clientId]);

  async function toggleTag(tagId: string, hasTag: boolean) {
    const res = await fetch(`/api/clients/${clientId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId, action: hasTag ? "remove" : "add" }),
    });
    if (res.ok) {
      const tags = await res.json();
      setClientTags(tags);
    }
  }

  const availableTags = allTags.filter(
    (t) => !clientTags.some((ct) => ct.id === t.id)
  );

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {clientTags.map((tag) => (
        <Badge
          key={tag.id}
          className="text-[10px] font-medium text-white gap-1 pr-1"
          style={{ background: tag.color }}
        >
          {tag.name}
          <button
            onClick={() => toggleTag(tag.id, true)}
            className="hover:bg-white/20 rounded-full p-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      {allTags.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="start">
            {availableTags.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2 text-center">All tags applied</p>
            ) : (
              availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => { toggleTag(tag.id, false); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-xs text-left"
                >
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: tag.color }} />
                  {tag.name}
                </button>
              ))
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
