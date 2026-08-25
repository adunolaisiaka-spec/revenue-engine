import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { requireOrgContext } from "@/server/auth";
import { db } from "@/server/db";

// Streams a research brief's Markdown/PDF from the private Blob store, after
// verifying the requester's organization actually owns the brief — this is
// the only way these documents are ever served, since the store is private.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ briefId: string }> }
) {
  const { organizationId } = await requireOrgContext();
  const { briefId } = await params;

  const type = req.nextUrl.searchParams.get("type");
  if (type !== "markdown" && type !== "pdf") {
    return NextResponse.json({ error: "type must be 'markdown' or 'pdf'" }, { status: 400 });
  }

  const brief = await db.researchBrief.findFirst({ where: { id: briefId, organizationId } });
  if (!brief) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pathname = type === "markdown" ? brief.markdownUrl : brief.pdfUrl;
  if (!pathname) {
    return NextResponse.json({ error: "Document not available for this brief" }, { status: 404 });
  }

  const blob = await get(pathname, { access: "private" });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "Document not found in storage" }, { status: 404 });
  }

  const filename = pathname.split("/").pop() ?? `research.${type === "markdown" ? "md" : "pdf"}`;

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
