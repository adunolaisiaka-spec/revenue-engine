"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createDealAction } from "@/server/actions/deals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateDealDialog({
  companies,
  stages,
  defaultCompanyId,
}: {
  companies: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  defaultCompanyId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createDealAction(formData);
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
        toast.success("Deal created");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create deal");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>New deal</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyId">Company</Label>
            <Select
              name="companyId"
              defaultValue={defaultCompanyId}
              items={companies.map((company) => ({ value: company.id, label: company.name }))}
              required
            >
              <SelectTrigger id="companyId" className="w-full">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stageId">Stage</Label>
            <Select
              name="stageId"
              defaultValue={stages[0]?.id}
              items={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
              required
            >
              <SelectTrigger id="stageId" className="w-full">
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="value">Value ($)</Label>
              <Input id="value" name="value" type="number" min="0" step="0.01" defaultValue="0" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="expectedCloseDate">Expected close</Label>
              <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
