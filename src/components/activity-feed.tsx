"use client";

import { useRef, useTransition } from "react";
import { logActivityAction } from "@/server/actions/activities";
import type { ActivityScope } from "@/server/queries/activities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ActivityItem = {
  id: string;
  type: string;
  body: string | null;
  createdAt: Date;
  author: { name: string | null; email: string } | null;
};

export function ActivityFeed({
  scope,
  revalidatePathTarget,
  activities,
}: {
  scope: ActivityScope;
  revalidatePathTarget: string;
  activities: ActivityItem[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await logActivityAction(scope, revalidatePathTarget, formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2">
        <input type="hidden" name="type" value="NOTE" />
        <Textarea name="body" placeholder="Add a note..." required rows={3} />
        <Button type="submit" disabled={isPending} className="self-end">
          {isPending ? "Posting…" : "Post note"}
        </Button>
      </form>
      <ul className="flex flex-col gap-3">
        {activities.length === 0 && (
          <li className="text-sm text-muted-foreground">No activity yet.</li>
        )}
        {activities.map((activity) => (
          <li key={activity.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{activityLabel(activity.type)}</span>
              <span>{new Date(activity.createdAt).toLocaleString()}</span>
            </div>
            {activity.body && <p className="mt-1">{activity.body}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {activity.author?.name ?? activity.author?.email ?? "System"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function activityLabel(type: string) {
  switch (type) {
    case "STAGE_CHANGE":
      return "Stage changed";
    case "NOTE":
      return "Note";
    case "CALL":
      return "Call";
    case "EMAIL":
      return "Email";
    case "MEETING":
      return "Meeting";
    default:
      return type;
  }
}
