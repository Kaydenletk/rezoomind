import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { THEME_STORAGE_KEY } from "@/lib/client-persisted-state";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Rezoomind",
  description: "Internship command center — real-time job data for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = storedTheme === 'dark' || (storedTheme === null && prefersDark);
                document.documentElement.classList.toggle('dark', isDark);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${dmMono.variable} bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
