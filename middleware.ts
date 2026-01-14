import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/resume", "/interests", "/alerts", "/matches"];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = "/login";
    nextUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(nextUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/resume/:path*", "/interests/:path*", "/alerts/:path*", "/matches/:path*"],
};
