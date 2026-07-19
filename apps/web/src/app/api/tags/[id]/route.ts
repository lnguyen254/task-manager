import { NextRequest } from "next/server";

import { proxyAuthedRequest } from "@/lib/backend";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAuthedRequest(request, `/tags/${id}`, { method: "DELETE" });
}
