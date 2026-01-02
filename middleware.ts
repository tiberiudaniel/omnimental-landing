import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const e2e = request.nextUrl.searchParams.get("e2e");
  if (e2e === "1") {
    const response = NextResponse.next();
    response.cookies.set("omni_e2e", "1", { path: "/", sameSite: "lax" });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
