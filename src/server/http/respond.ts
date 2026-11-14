import { NextResponse } from "next/server";
import { toErrorResponse } from "../lib/errors";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  const { status, body } = toErrorResponse(error);
  return NextResponse.json(body, { status });
}
