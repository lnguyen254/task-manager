import { NextRequest, NextResponse } from "next/server";

import { proxyAuthedRequest } from "@/lib/backend";

export async function GET(request: NextRequest) {
  return proxyAuthedRequest(request, "/tags", { method: "GET" });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  return proxyAuthedRequest(request, "/tags", { method: "POST", body });
}
