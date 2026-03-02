"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch } from "lucide-react";

type PipelineOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

export function PipelineSwitcher({
  pipelines,
  currentPipelineId,
}: {
  pipelines: PipelineOption[];
  currentPipelineId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(pipelineId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pipeline", pipelineId);
    router.push(`/dashboard?${params.toString()}`);
  }

  if (pipelines.length <= 1) return null;

  return (
    <Select value={currentPipelineId} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-auto gap-1.5 text-sm font-semibold border-none shadow-none bg-transparent px-0 focus:ring-0 focus:ring-offset-0">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {pipelines.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <span>{p.name}</span>
            {p.isDefault && (
              <span className="ml-1.5 text-xs text-muted-foreground">(default)</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
