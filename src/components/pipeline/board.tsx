"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { updateDealStageAction } from "@/server/actions/deals";
import { DealCard, type PipelineDeal } from "./card";

export type PipelineStageWithDeals = {
  id: string;
  name: string;
  deals: PipelineDeal[];
};

export function PipelineBoard({ stages }: { stages: PipelineStageWithDeals[] }) {
  const [isPending, startTransition] = useTransition();
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveDealId(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const newStageId = String(over.id);
    const currentStage = stages.find((stage) =>
      stage.deals.some((deal) => deal.id === dealId)
    );
    if (!currentStage || currentStage.id === newStageId) return;

    startTransition(async () => {
      await updateDealStageAction(dealId, newStageId);
      router.refresh();
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActiveDealId(String(event.active.id))}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`flex flex-1 gap-4 overflow-x-auto p-6 transition-opacity ${
          isPending ? "opacity-60" : ""
        }`}
      >
        {stages.map((stage) => (
          <StageColumn key={stage.id} stage={stage} activeDealId={activeDealId} />
        ))}
      </div>
    </DndContext>
  );
}

function StageColumn({
  stage,
  activeDealId,
}: {
  stage: PipelineStageWithDeals;
  activeDealId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3 ${
        isOver ? "ring-2 ring-ring" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium">{stage.name}</h2>
        <span className="text-xs text-muted-foreground">{stage.deals.length}</span>
      </div>
      <div className="flex min-h-8 flex-col gap-2">
        {stage.deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} isDragging={activeDealId === deal.id} />
        ))}
      </div>
    </div>
  );
}
