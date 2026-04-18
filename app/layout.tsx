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
  title: {
    default: "Rezoomind | AI-Powered Internship & New Grad Job Search",
    template: "%s | Rezoomind",
  },
  description:
    "Find internships and new-grad jobs with AI-powered fit scoring. Browse live roles, get match recommendations, and tailor your resume — all without creating an account first.",
  keywords: [
    "internships",
    "new grad jobs",
    "software engineering internships",
    "entry level jobs",
    "AI resume matching",
    "job search for students",
  ],
  authors: [{ name: "Rezoomind" }],
  creator: "Rezoomind",
  metadataBase: new URL("https://rezoomind.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rezoomind.vercel.app",
    siteName: "Rezoomind",
    title: "Rezoomind | AI-Powered Internship & New Grad Job Search",
    description:
      "Find internships and new-grad jobs with AI-powered fit scoring. Browse live roles and tailor your resume.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rezoomind | AI-Powered Internship & New Grad Job Search",
    description: "Find internships with AI-powered fit scoring.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "TE4_CR-Q2pIYH_Ux24c9mt0fV74isRIY9-C9Y7GiiB4",
  },
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
        className={`${inter.variable} ${plusJakarta.variable} ${dmMono.variable} bg-surface text-fg antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
