import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

type SupabaseCookie = {
  name: string;
  value: string;
};

const parseCookieHeader = (cookieHeader: string): SupabaseCookie[] => {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return { name: part, value: "" };
      }
      return {
        name: part.slice(0, separatorIndex),
        value: part.slice(separatorIndex + 1),
      };
    });
};

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const cookieStore = cookies();
  const getAllCookies = async (): Promise<SupabaseCookie[]> => {
    const getAll = (cookieStore as { getAll?: () => SupabaseCookie[] }).getAll;
    if (typeof getAll === "function") {
      return getAll();
    }

    const headerStore = await headers();
    const cookieHeader = headerStore.get("cookie") ?? "";
    return parseCookieHeader(cookieHeader);
  };

  return createServerClient(url, anonKey, {
    cookies: {
      async getAll() {
        return getAllCookies();
      },
      setAll(cookiesToSet) {
        const setCookie = (cookieStore as {
          set?: (name: string, value: string, options?: Record<string, unknown>) => void;
        }).set;
        if (!setCookie) return;
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options);
        });
      },
    },
  });
}
