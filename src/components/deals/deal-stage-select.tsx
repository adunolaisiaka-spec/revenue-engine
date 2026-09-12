"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateDealStageAction } from "@/server/actions/deals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DealStageSelect({
  dealId,
  stageId,
  stages,
}: {
  dealId: string;
  stageId: string;
  stages: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(newStageId: string | null) {
    if (!newStageId) return;
    startTransition(async () => {
      try {
        await updateDealStageAction(dealId, newStageId);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to change stage");
      }
    });
  }

  return (
    <Select
      value={stageId}
      onValueChange={handleChange}
      disabled={isPending}
      items={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stages.map((stage) => (
          <SelectItem key={stage.id} value={stage.id}>
            {stage.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
