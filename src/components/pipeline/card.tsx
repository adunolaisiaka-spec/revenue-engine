"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";
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
  isOverlay = false,
}: {
  deal: PipelineDeal;
  isDragging: boolean;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
  });

  // Once a DragOverlay copy exists, the original in-place node should just
  // sit there faded rather than also sliding under the cursor.
  const style =
    transform && !isDragging && !isOverlay
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined;

  const cardBody = (
    <Card className={`gap-0 py-0 ${isOverlay ? "cursor-grabbing shadow-xl" : "cursor-grab active:cursor-grabbing"}`}>
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
  );

  if (isOverlay) {
    return (
      <motion.div
        initial={{ scale: 1, rotate: 0 }}
        animate={{ scale: 1.05, rotate: 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
        {cardBody}
      </motion.div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`transition-opacity duration-150 ${isDragging ? "z-10 opacity-40" : ""}`}
    >
      <motion.div
        whileHover={isDragging ? undefined : { y: -3, scale: 1.015 }}
        whileTap={isDragging ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
      >
        {cardBody}
      </motion.div>
    </div>
  );
}
