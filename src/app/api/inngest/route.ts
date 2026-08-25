import { serve } from "inngest/next";
import { inngest } from "@/server/inngest/client";
import { snapshotResearch, deepDiveResearch } from "@/server/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [snapshotResearch, deepDiveResearch],
});
