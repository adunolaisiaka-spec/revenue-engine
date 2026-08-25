import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "revenue-engine" });

export type SnapshotRequestedData = {
  briefId: string;
  organizationId: string;
  companyId: string;
};

export type DeepDiveRequestedData = {
  briefId: string;
  organizationId: string;
  version: number;
  subjectType: "COMPANY" | "MARKET";
  companyId?: string;
  marketQuery?: string;
};
