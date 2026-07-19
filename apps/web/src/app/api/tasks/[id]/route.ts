import { NextRequest, NextResponse } from "next/server";

import { proxyAuthedRequest } from "@/lib/backend";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAuthedRequest(request, `/tasks/${id}`, { method: "GET" });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  return proxyAuthedRequest(request, `/tasks/${id}`, { method: "PATCH", body });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAuthedRequest(request, `/tasks/${id}`, { method: "DELETE" });
}
