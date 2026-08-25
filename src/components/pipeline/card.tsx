"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";

export type PipelineDeal = {
  id: string;
  title: string;
  value: string;
  company: { id: string; name: string };
  owner: { id: string; name: string | null; email: string };
};

export function DealCard({
  deal,
  isDragging,
}: {
  deal: PipelineDeal;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "z-10 opacity-50" : ""}
    >
      <Card className="cursor-grab gap-0 py-0 active:cursor-grabbing">
        <CardContent className="flex flex-col gap-1 p-3">
          <Link href={`/deals/${deal.id}`} className="text-sm font-medium hover:underline">
            {deal.title}
          </Link>
          <span className="text-xs text-muted-foreground">{deal.company.name}</span>
          <span className="text-xs font-medium">
            ${Number(deal.value).toLocaleString()}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
