"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

type Workspace = { id: string; name: string; slug: string };

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
}: {
  workspaces: Workspace[];
  currentWorkspaceId: string;
}) {
  const [current, setCurrent] = useState(currentWorkspaceId);
  const activeWs = workspaces.find((w) => w.id === current) ?? workspaces[0];

  useEffect(() => {
    setCurrent(currentWorkspaceId);
  }, [currentWorkspaceId]);

  async function switchWorkspace(workspaceId: string) {
    if (workspaceId === current) return;
    document.cookie = `active_workspace=${workspaceId};path=/;max-age=${60 * 60 * 24 * 365}`;
    setCurrent(workspaceId);
    window.location.href = "/dashboard";
  }

  if (workspaces.length <= 1) {
    return (
      <span className="text-sm font-medium text-muted-foreground hidden sm:block">
        {activeWs?.name}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden sm:flex">
          {activeWs?.name}
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs">Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => switchWorkspace(ws.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="truncate">{ws.name}</span>
            {ws.id === current && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => (window.location.href = "/signup?new=true")}
          className="text-muted-foreground cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
